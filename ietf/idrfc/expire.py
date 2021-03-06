# expiry of Internet Drafts

from django.conf import settings
from django.template.loader import render_to_string
from django.db.models import Q

import datetime, os, shutil, glob, re, itertools

from ietf.utils.mail import send_mail, send_mail_subj
from ietf.idrfc.utils import log_state_changed
from ietf.doc.models import Document, DocEvent, State, save_document_in_history, IESG_SUBSTATE_TAGS
from ietf.person.models import Person, Email
from ietf.meeting.models import Meeting

def expirable_draft(draft):
    """Return whether draft is in an expirable state or not. This is
    the single draft version of the logic in expirable_drafts. These
    two functions need to be kept in sync."""
    return (draft.expires and draft.get_state_slug() == "active"
            and draft.get_state_slug("draft-iesg") in (None, "watching", "dead")
            and draft.get_state_slug("draft-stream-%s" % draft.stream_id) not in ("rfc-edit", "pub")
            and not draft.tags.filter(slug="rfc-rev"))

def expirable_drafts():
    """Return a queryset with expirable drafts."""
    # the general rule is that each active draft is expirable, unless
    # it's in a state where we shouldn't touch it
    d = Document.objects.filter(states__type="draft", states__slug="active").exclude(expires=None)

    nonexpirable_states = []
    # all IESG states except AD Watching and Dead block expiry
    nonexpirable_states += list(State.objects.filter(used=True, type="draft-iesg").exclude(slug__in=("watching", "dead")))
    # sent to RFC Editor and RFC Published block expiry (the latter
    # shouldn't be possible for an active draft, though)
    nonexpirable_states += list(State.objects.filter(used=True, type__in=("draft-stream-iab", "draft-stream-irtf", "draft-stream-ise"), slug__in=("rfc-edit", "pub")))

    d = d.exclude(states__in=nonexpirable_states)

    # under review by the RFC Editor blocks expiry
    d = d.exclude(tags="rfc-rev")

    return d.distinct()

def get_soon_to_expire_drafts(days_of_warning):
    start_date = datetime.date.today() - datetime.timedelta(1)
    end_date = start_date + datetime.timedelta(days_of_warning)

    return expirable_drafts().filter(expires__gte=start_date, expires__lt=end_date)

def get_expired_drafts():
    return expirable_drafts().filter(expires__lt=datetime.date.today() + datetime.timedelta(1))

def in_draft_expire_freeze(when=None):
    if when == None:
        when = datetime.datetime.now()

    d = Meeting.get_second_cut_off()
    # for some reason, the old Perl code started at 9 am
    second_cut_off = datetime.datetime.combine(d, datetime.time(9, 0))
    
    d = Meeting.get_ietf_monday()
    ietf_monday = datetime.datetime.combine(d, datetime.time(0, 0))
    
    return second_cut_off <= when < ietf_monday

def send_expire_warning_for_draft(doc):
    if doc.get_state_slug("draft-iesg") == "dead":
        return # don't warn about dead documents

    expiration = doc.expires.date()

    to = [e.formatted_email() for e in doc.authors.all() if not e.address.startswith("unknown-email")]
    cc = None
    if doc.group.type_id in ("wg", "rg"):
        cc = [e.formatted_email() for e in Email.objects.filter(role__group=doc.group, role__name="chair") if not e.address.startswith("unknown-email")]

    s = doc.get_state("draft-iesg")
    state = s.name if s else "I-D Exists"
        
    frm = None
    request = None
    if to or cc:
        send_mail(request, to, frm,
                  u"Expiration impending: %s" % doc.file_tag(),
                  "idrfc/expire_warning_email.txt",
                  dict(doc=doc,
                       state=state,
                       expiration=expiration
                       ),
                  cc=cc)

def send_expire_notice_for_draft(doc):
    if not doc.ad or doc.get_state_slug("draft-iesg") == "dead":
        return

    s = doc.get_state("draft-iesg")
    state = s.name if s else "I-D Exists"

    request = None
    to = doc.ad.role_email("ad").formatted_email()
    send_mail(request, to,
              "I-D Expiring System <ietf-secretariat-reply@ietf.org>",
              u"I-D was expired %s" % doc.file_tag(),
              "idrfc/id_expired_email.txt",
              dict(doc=doc,
                   state=state,
                   ))

def move_draft_files_to_archive(doc, rev):
    def move_file(f):
        src = os.path.join(settings.INTERNET_DRAFT_PATH, f)
        dst = os.path.join(settings.INTERNET_DRAFT_ARCHIVE_DIR, f)

        if os.path.exists(src):
            shutil.move(src, dst)

    file_types = ['txt', 'txt.p7s', 'ps', 'pdf']
    for t in file_types:
        move_file("%s-%s.%s" % (doc.name, rev, t))

def expire_draft(doc):
    # clean up files
    move_draft_files_to_archive(doc, doc.rev)

    # change the state
    system = Person.objects.get(name="(System)")

    save_document_in_history(doc)
    if doc.latest_event(type='started_iesg_process'):
        dead_state = State.objects.get(used=True, type="draft-iesg", slug="dead")
        prev = doc.get_state("draft-iesg")
        prev_tag = doc.tags.filter(slug__in=IESG_SUBSTATE_TAGS)
        prev_tag = prev_tag[0] if prev_tag else None
        if prev != dead_state:
            doc.set_state(dead_state)
            if prev_tag:
                doc.tags.remove(prev_tag)
            log_state_changed(None, doc, system, prev, prev_tag)

        e = DocEvent(doc=doc, by=system)
        e.type = "expired_document"
        e.desc = "Document has expired"
        e.save()

    doc.set_state(State.objects.get(used=True, type="draft", slug="expired"))
    doc.time = datetime.datetime.now()
    doc.save()

def clean_up_draft_files():
    """Move unidentified and old files out of the Internet Draft directory."""
    cut_off = datetime.date.today()

    pattern = os.path.join(settings.INTERNET_DRAFT_PATH, "draft-*.*")
    files = []
    filename_re = re.compile('^(.*)-(\d\d)$')
    
    def splitext(fn):
        """
        Split the pathname path into a pair (root, ext) such that root + ext
        == path, and ext is empty or begins with a period and contains all
        periods in the last path component.

        This differs from os.path.splitext in the number of periods in the ext
        parts when the final path component contains more than one period.
        """
        s = fn.rfind("/")
        if s == -1:
            s = 0
        i = fn[s:].find(".")
        if i == -1:
            return fn, ''
        else:
            return fn[:s+i], fn[s+i:]

    for path in glob.glob(pattern):
        basename = os.path.basename(path)
        stem, ext = splitext(basename)
        match = filename_re.search(stem)
        if not match:
            filename, revision = ("UNKNOWN", "00")
        else:
            filename, revision = match.groups()

        def move_file_to(subdir):
            shutil.move(path,
                        os.path.join(settings.INTERNET_DRAFT_ARCHIVE_DIR, subdir, basename))
            
        try:
            doc = Document.objects.get(name=filename, rev=revision)

            state = doc.get_state_slug()

            if state == "rfc":
                if ext != ".txt":
                    move_file_to("unknown_ids")
            elif state in ("expired", "repl", "auth-rm", "ietf-rm") and doc.expires and doc.expires.date() < cut_off:
                # Expired, Replaced, Withdrawn by Author/IETF, and expired
                if os.path.getsize(path) < 1500:
                    # we don't make tombstones any more so this should
                    # go away in the future
                    move_file_to("deleted_tombstones")
                else:
                    move_file_to("expired_without_tombstone")
            
        except Document.DoesNotExist:
            move_file_to("unknown_ids")
