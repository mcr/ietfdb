from django.utils import simplejson
from dajaxice.core import dajaxice_functions
from dajaxice.decorators import dajaxice_register
from ietf.ietfauth.decorators import group_required

# New models
from ietf.meeting.models import Meeting, TimeSlot, Session, ScheduledSession, Room
from ietf.group.models import Group
import datetime

import logging
log = logging.getLogger(__name__)

@dajaxice_register
def sayhello(request):
    return simplejson.dumps({'message':'Hello World'})

@group_required('Area_Director','Secretariat')
@dajaxice_register
def update_timeslot(request, new_event):
    # get the ScheduledSession.
    ss_id = int(new_event["session_id"])
    timeslot_id = int(new_event["timeslot_id"])
    
    log.info("%s is updating scheduledsession_id=%u to timeslot_id=%u" %
             (request.user, ss_id, timeslot_id))
    ss = ScheduledSession.objects.get(id=ss_id)
    try:
        # find the timeslot, assign it to the ScheduledSession's timeslot, save it. 
        slots = TimeSlot.objects.get(id=timeslot_id)
        ss.timeslot = slots
        ss.save()
        
    except Exception as e:
        print e

    return simplejson.dumps({'message':'im happy!'})


@dajaxice_register
def get_info(request, meeting_obj):#, event):
    # print event
    # try:
    #     ss = ScheduledSession.objects.get(id=int(event["session_id"]))
    #     print ss
    # except Exception as e:
    #     print e
    ss = ScheduledSession.objects.get(id=int(meeting_obj["session_id"]))

  
    return simplejson.dumps({'room':str(ss.timeslot.location),
                             'ss_id':str(meeting_obj["session_id"]),
                             'group':str(ss.session.group.acronym),
                             'name':str(ss.session.name),
                             'short_name':str(ss.session.name),
                             'agenda_note':str(ss.session.agenda_note),
                             'attendees':str(ss.session.attendees),
                             'status': str(ss.session.status),
                             'requested_time': str(ss.session.requested.strftime("%Y-%m-%d")),
                             'requested_by': str(ss.session.requested_by),
                             'requested_duration': str(ss.session.requested_duration),
                             'ss_name':str(ss.schedule.name),
                             'ss_owner':str(ss.schedule.owner),
                             'ss_visible':str(ss.schedule.visible),
                             'ss_public':str(ss.schedule.public),
                             'ts_time':str(ss.timeslot.time),
                             'ts_day_of_week':str(ss.timeslot.time.strftime("%A")),
                             'ts_time_hour':str(ss.timeslot.time.strftime("%H:%M")),
                             'ts_duration':str(ss.timeslot.duration),
                             'area':str(ss.session.group.parent.acronym),
                             'responsible_ad':str(ss.session.group.ad),
                             'GroupInfo_state':str(ss.session.group.state),
                             
                             })
