from django.utils import simplejson
from dajaxice.core import dajaxice_functions
from dajaxice.decorators import dajaxice_register
from ietf.ietfauth.decorators import group_required
from ietf.meeting.views  import get_meeting

from django.core.serializers import DjangoJSONEncoder

json_encode = DjangoJSONEncoder(skipkeys=False,
                                ensure_ascii=True,
                                check_circular=True,
                                allow_nan=True,
                                indent=0,
                                separators=None,
                                encoding='utf-8',
                                default=None,
                                )


# New models
from ietf.meeting.models import Meeting, TimeSlot, Session, ScheduledSession, Room
from ietf.group.models import Group
import datetime

import logging

logging.basicConfig(filename='ajax.log',level=logging.DEBUG) # this is not okay for production, put the log somewhere useful. 

log = logging.getLogger(__name__)

@dajaxice_register
def sayhello(request):
    return json_encode.encode({'message':'Hello World'})

@group_required('Area_Director','Secretariat') 
@dajaxice_register
def update_timeslot(request, session_id=None, scheduledsession_id=None):
    if(session_id == None or scheduledsession_id == None):
        if(scheduledsession_id == None):
            pass # most likely the user moved the item and dropped it in the same box. js should never make the call in this case.
        else:
            logging.debug("session_id=%s , scheduledsession_id=%s doing nothing and returning" % (session_id, scheduledsession_id))

        return

    session_id = int(session_id)
    ss_id = int(scheduledsession_id)
    log.info("%s is updating scheduledsession_id=%u to session_id=%u" %
             (request.user, ss_id, session_id))

    try:
        session = Session.objects.get(pk=session_id)
    except:
        return json_encode.encode({'error':'invalid session'})

    for ss in session.scheduledsession_set.all():
        ss.session = None
        ss.save()

    try:
        # find the scheduledsession, assign the Session to it.
        ss = ScheduledSession.objects.get(pk=ss_id)
        ss.session = session
        ss.save()
    except Exception as e:
        return json_encode.encode({'error':'invalid scheduledsession'})
        
    return json_encode.encode({'message':'im happy!'})


@dajaxice_register
def get_info(request, scheduledsession_id=None, active_slot_id=None, timeslot_id=None, session_id=None):#, event):
    
    try:
        session = Session.objects.get(pk=int(session_id))
    except Session.DoesNotExist:
        logging.debug("No ScheduledSession was found for id:%s" % (session_id))
        # in this case we want to return empty the session information and perhaps indicate to the user there is a issue.
        return

  
    return json_encode.encode({'active_slot_id':str(active_slot_id),
                             'ss_id':str(scheduledsession_id),
                             'timeslot_id':str(timeslot_id),
                             'group':str(session.group.acronym),
                             'name':str(session.name),
                             'short_name':str(session.name),
                             'agenda_note':str(session.agenda_note),
                             'attendees':str(session.attendees),
                             'status': str(session.status),
                             'requested_time': str(session.requested.strftime("%Y-%m-%d")),
                             'requested_by': str(session.requested_by),
                             'requested_duration': str(session.requested_duration),
                             'area':str(session.group.parent.acronym),
                             'responsible_ad':str(session.group.ad),
                             'GroupInfo_state':str(session.group.state),
                             })

def meeting_json(request, meeting_num):
    meeting = get_meeting(meeting_num)
    return json_encode.encode(meeting.simplejson)

# current dajaxice does not support GET, only POST.
# it has almost no value for GET, particularly if the results are going to be
# public anyway.
def session_constraints(request, num=None, sessionid=None):
    meeting = get_meeting(num)

    print "Getting meeting=%s session contraints for %s" % (num, sessionid)
    try:
        session = Session.objects.get(pk=int(sessionid))
    except Session.DoesNotExist:
        return simplejson.dumps({"error":"no such session"})

    constraints = []
    constraints.append(session.group.constraint_source_set.all())
    constraints.append(session.group.constraint_target_set.all())
    constraint_list = []
    for constraint in contraints:
        ct1 = dict()
        ct1['constraint_id'] = constraint.id
        ct1['href']          = constraint.url
        ct1['name'] = constraint.name
        if constraint.person is not None:
            ct1['person'] = contraint.person.url
        if constraint.source is not None:
            ct1['source'] = contraint.source.url
        if constraint.target is not None:
            ct1['target'] = contraint.target.url
        ct1['meeting'] = constraint.meeting.url
        constraint_list.append(ct1)
           

    return json_encode.encode(constraints)


