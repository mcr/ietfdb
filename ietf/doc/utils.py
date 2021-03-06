import os, re, urllib
import math

from django.conf import settings

# Should this move from idrfc to doc?
from ietf.idrfc import markup_txt

from ietf.doc.models import *

def get_state_types(doc):
    res = []

    if not doc:
        return res
    
    res.append(doc.type_id)

    if doc.type_id == "draft":
        if doc.stream_id and doc.stream_id != "legacy":
            res.append("draft-stream-%s" % doc.stream_id)

        res.append("draft-iesg")
        res.append("draft-iana-review")
        res.append("draft-iana-action")
        res.append("draft-rfceditor")
        
    return res

def get_tags_for_stream_id(stream_id):
    if stream_id == "ietf":
        return ["w-expert", "w-extern", "w-merge", "need-aut", "w-refdoc", "w-refing", "rev-wg", "rev-wglc", "rev-ad", "rev-iesg", "sheph-u", "other"]
    elif stream_id == "iab":
        return ["need-ed", "w-part", "w-review", "need-rev", "sh-f-up"]
    elif stream_id == "irtf":
        return ["need-ed", "need-sh", "w-dep", "need-rev", "iesg-com"]
    elif stream_id == "ise":
        return ["w-dep", "w-review", "need-rev", "iesg-com"]
    else:
        return []

def needed_ballot_positions(doc, active_positions):
    '''Returns text answering the question "what does this document
    need to pass?".  The return value is only useful if the document
    is currently in IESG evaluation.'''
    yes = [p for p in active_positions if p and p.pos_id == "yes"]
    noobj = [p for p in active_positions if p and p.pos_id == "noobj"]
    blocking = [p for p in active_positions if p and p.pos.blocking]
    recuse = [p for p in active_positions if p and p.pos_id == "recuse"]

    answer = []
    if len(yes) < 1:
        answer.append("Needs a YES.")
    if blocking:
        if len(blocking) == 1:
            answer.append("Has a %s." % blocking[0].pos.name.upper())
        else:
            if blocking[0].pos.name.upper().endswith('S'):
                answer.append("Has %d %ses." % (len(blocking), blocking[0].pos.name.upper()))
            else:
                answer.append("Has %d %ss." % (len(blocking), blocking[0].pos.name.upper()))
    needed = 1
    if doc.type_id == "draft" and doc.intended_std_level_id in ("bcp", "ps", "ds", "std"):
        # For standards-track, need positions from 2/3 of the
        # non-recused current IESG.
        needed = int(math.ceil((len(active_positions) - len(recuse)) * 2.0/3.0))
    else:
        if len(yes) < 1:
            return " ".join(answer)

    have = len(yes) + len(noobj)
    if have < needed:
        more = needed - have
        if more == 1:
            answer.append("Needs one more YES or NO OBJECTION position to pass.")
        else:
            answer.append("Needs %d more YES or NO OBJECTION positions to pass." % more)
    else:
        if blocking:
            answer.append("Has enough positions to pass once %s positions are resolved." % blocking[0].pos.name.upper())
        else:
            answer.append("Has enough positions to pass.")

    return " ".join(answer)
    
def create_ballot_if_not_open(doc, by, ballot_slug):
    if not doc.ballot_open(ballot_slug):
        e = BallotDocEvent(type="created_ballot", by=by, doc=doc)
        e.ballot_type = BallotType.objects.get(doc_type=doc.type, slug=ballot_slug)
        e.desc = u'Created "%s" ballot' % e.ballot_type.name
        e.save()

def close_ballot(doc, by, ballot_slug):
    if doc.ballot_open(ballot_slug):
        e = BallotDocEvent(type="closed_ballot", doc=doc, by=by)
        e.ballot_type = BallotType.objects.get(doc_type=doc.type,slug=ballot_slug)
        e.desc = 'Closed "%s" ballot' % e.ballot_type.name
        e.save()

def close_open_ballots(doc, by):
    for t in BallotType.objects.filter(doc_type=doc.type_id):
        close_ballot(doc, by, t.slug )

def augment_with_start_time(docs):
    """Add a started_time attribute to each document with the time of
    the first revision."""
    docs = list(docs)

    docs_dict = {}
    for d in docs:
        docs_dict[d.pk] = d
        d.start_time = None

    seen = set()

    for e in DocEvent.objects.filter(type="new_revision", doc__in=docs).order_by('time'):
        if e.doc_id in seen:
            continue

        docs_dict[e.doc_id].start_time = e.time
        seen.add(e.doc_id)

    return docs

def get_chartering_type(doc):
    chartering = ""
    if doc.get_state_slug() not in ("notrev", "approved"):
        if doc.group.state_id in ("proposed", "bof"):
            chartering = "initial"
        elif doc.group.state_id == "active":
            chartering = "rechartering"

    return chartering

def augment_events_with_revision(doc, events):
    """Take a set of events for doc and add a .rev attribute with the
    revision they refer to by checking NewRevisionDocEvents."""

    event_revisions = list(NewRevisionDocEvent.objects.filter(doc=doc).order_by('time', 'id').values('id', 'rev', 'time'))

    if doc.type_id == "draft" and doc.get_state_slug() == "rfc":
        # add fake "RFC" revision
        e = doc.latest_event(type="published_rfc")
        if e:
            event_revisions.append(dict(id=e.id, time=e.time, rev="RFC"))
            event_revisions.sort(key=lambda x: (x["time"], x["id"]))

    for e in sorted(events, key=lambda e: (e.time, e.id), reverse=True):
        while event_revisions and (e.time, e.id) < (event_revisions[-1]["time"], event_revisions[-1]["id"]):
            event_revisions.pop()

        if event_revisions:
            cur_rev = event_revisions[-1]["rev"]
        else:
            cur_rev = "00"

        e.rev = cur_rev

def add_links_in_new_revision_events(doc, events, diff_revisions):
    """Add direct .txt links and diff links to new_revision events."""
    prev = None

    diff_urls = dict(((name, revision), url) for name, revision, time, url in diff_revisions)

    for e in sorted(events, key=lambda e: (e.time, e.id)):
        if not e.type == "new_revision":
            continue

        if not (e.doc.name, e.rev) in diff_urls:
            continue

        full_url = diff_url = diff_urls[(e.doc.name, e.rev)]

        if doc.type_id in "draft": # work around special diff url for drafts
            full_url = "http://tools.ietf.org/id/" + diff_url + ".txt"

        # build links
        links = r'<a href="%s">\1</a>' % full_url
        if prev:
            links += ""

        if prev != None:
            links += ' (<a href="http:%s?url1=%s&url2=%s">diff from previous</a>)' % (settings.RFCDIFF_PREFIX, urllib.quote(diff_url, safe="~"), urllib.quote(prev, safe="~"))

        # replace the bold filename part
        e.desc = re.sub(r"<b>(.+-[0-9][0-9].txt)</b>", links, e.desc)

        prev = diff_url


def get_document_content(key, filename, split=True, markup=True):
    f = None
    try:
        f = open(filename, 'rb')
        raw_content = f.read()
    except IOError:
        error = "Error; cannot read ("+key+")"
        return error
    finally:
        if f:
            f.close()
    if markup:
        return markup_txt.markup(raw_content, split)
    else:
        return raw_content

def log_state_changed(request, doc, by, new_description, old_description):
    e = DocEvent(doc=doc, by=by)
    e.type = "changed_document"
    e.desc = u"State changed to <b>%s</b> from %s" % (new_description, old_description)
    e.save()
    return e

def add_state_change_event(doc, by, prev_state, new_state, timestamp=None):
    """Add doc event to explain that state change just happened."""
    if prev_state == new_state:
        return None

    e = StateDocEvent(doc=doc, by=by)
    e.type = "changed_state"
    e.state_type = (prev_state or new_state).type
    e.state = new_state
    e.desc = "%s changed to <b>%s</b>" % (e.state_type.label, new_state.name)
    if prev_state:
        e.desc += " from %s" % prev_state.name
    if timestamp:
        e.time = timestamp
    e.save()
    return e
    
def prettify_std_name(n):
    if re.match(r"(rfc|bcp|fyi|std)[0-9]+", n):
        return n[:3].upper() + " " + n[3:]
    else:
        return n

def nice_consensus(consensus):
    mapping = {
        None: "Unknown",
        True: "Yes",
        False: "No"
        }
    return mapping[consensus]
