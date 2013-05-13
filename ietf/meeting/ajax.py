from django.utils import simplejson as json
from dajaxice.core import dajaxice_functions
from dajaxice.decorators import dajaxice_register
from django.core import serializers
from django.core.urlresolvers import reverse
from django.shortcuts import get_object_or_404

from ietf.ietfauth.decorators import group_required
from ietf.name.models import TimeSlotTypeName
from django.http import HttpResponseRedirect, HttpResponse, Http404

from ietf.meeting.helpers import get_meeting
from ietf.meeting.views   import edit_timeslots


# New models
from ietf.meeting.models import Meeting, TimeSlot, Session, ScheduledSession, Room
from ietf.group.models import Group
import datetime

import logging
import sys
from ietf.settings import LOG_DIR

log = logging.getLogger(__name__)

@dajaxice_register
def sayhello(request):
    return json.dumps({'message':'Hello World'})

@group_required('Area_Director','Secretariat')
@dajaxice_register
def update_timeslot(request, session_id=None, scheduledsession_id=None):
    if(session_id == None or scheduledsession_id == None):
        if(scheduledsession_id == None):
            pass # most likely the user moved the item and dropped it in the same box. js should never make the call in this case.
        else:
            logging.debug("session_id=%s , scheduledsession_id=%s doing nothing and returning" % (session_id, scheduledsession_id))

        return

    # if(scheduledsession_id == "Unassigned"):

    #     return
    session_id = int(session_id)


    # log.info("%s is updating scheduledsession_id=%u to session_id=%u" %
    #          (request.user, ss_id, session_id))


    try:
       session = Session.objects.get(pk=session_id)
    except:
        return json.dumps({'error':'invalid session'})

    log.debug(session)

    ss_id = int(scheduledsession_id)
    for ss in session.scheduledsession_set.all():
        ss.session = None
        ss.save()

    try:
        # find the scheduledsession, assign the Session to it.
        if(ss_id == 0):
            ss.session = None
        else:
            ss = ScheduledSession.objects.get(pk=ss_id)
            ss.session = session
        ss.save()
    except Exception as e:
        return json.dumps({'error':'invalid scheduledsession'})

    return json.dumps({'message':'valid'})

@group_required('Secretariat')
@dajaxice_register
def update_timeslot_purpose(request, timeslot_id=None, purpose=None):
    ts_id = int(timeslot_id)
    try:
       timeslot = TimeSlot.objects.get(pk=ts_id)
    except:
        return json.dumps({'error':'invalid timeslot'})

    try:
        timeslottypename = TimeSlotTypeName.objects.get(pk = purpose)
    except:
        return json.dumps({'error':'invalid timeslot type',
                           'extra': purpose})

    timeslot.type = timeslottypename
    timeslot.save()

    return json.dumps(timeslot.json_dict(request.get_host_protocol))

##########################################################################################################################
## ROOM API
##########################################################################################################################
from django.forms.models import modelform_factory
AddRoomForm = modelform_factory(Room, exclude=('meeting',))

# no authorization required
def timeslot_roomlist(request, mtg):
    rooms = mtg.room_set.all()
    json_array=[]
    for room in rooms:
        json_array.append(room.json_dict(request.get_host_protocol))
    return HttpResponse(json.dumps(json_array),
                        mimetype="text/json")

@group_required('Secretariat')
def timeslot_addroom(request, meeting):
    # authorization was enforced by the @group_require decorator above.

    newroomform = AddRoomForm(request.POST)
    if not newroomform.is_valid():
        return HttpResponse(status=404)

    newroom = newroomform.save(commit=False)
    newroom.meeting = meeting
    newroom.save()
    newroom.create_timeslots()

    if "HTTP_ACCEPT" in request.META and "text/json" in request.META['HTTP_ACCEPT']:
        return HttpResponseRedirect(
            reverse(timeslot_roomurl, args=[meeting.number, newroom.pk]))
    else:
        return HttpResponseRedirect(
            reverse(edit_timeslots, args=[meeting.number]))

@group_required('Secretariat')
def timeslot_delroom(request, meeting, roomid):
    # authorization was enforced by the @group_require decorator above.
    room = get_object_or_404(meeting.room_set, pk=roomid)

    room.delete_timeslots()
    room.delete()
    return HttpResponse('{"error":"none"}', status = 200)

def timeslot_roomsurl(request, num=None):
    meeting = get_meeting(num)

    if request.method == 'GET':
        return timeslot_roomlist(request, meeting)
    elif request.method == 'POST':
        return timeslot_addroom(request, meeting)

    # unacceptable reply
    return HttpResponse(status=406)

def timeslot_roomurl(request, num=None, roomid=None):
    meeting = get_meeting(num)

    if request.method == 'GET':
        room = get_object_or_404(meeting.room_set, pk=roomid)
        return HttpResponse(json.dumps(room.json_dict(request.get_host_protocol())),
                            mimetype="text/json")
    elif request.method == 'PUT':
        return timeslot_updroom(request, meeting)
    elif request.method == 'DELETE':
        return timeslot_delroom(request, meeting, roomid)

##########################################################################################################################
## DAY/SLOT API
##########################################################################################################################
AddSlotForm = modelform_factory(TimeSlot, exclude=('meeting','name','location','sessions', 'modified'))

# no authorization required to list.
def timeslot_slotlist(request, mtg):
    slots = mtg.timeslot_set.all()
    json_array=[]
    for slot in slots:
        json_array.append(slot.json_dict(request.get_host_protocol()))
    return HttpResponse(json.dumps(json_array),
                        mimetype="text/json")

@group_required('Secretariat')
def timeslot_addslot(request, meeting):

    # authorization was enforced by the @group_require decorator above.
    addslotform = AddSlotForm(request.POST)
    log.debug("newslot: %u" % ( addslotform.is_valid() ))
    if not addslotform.is_valid():
        return HttpResponse(status=404)

    newslot = addslotform.save(commit=False)
    newslot.meeting = meeting
    newslot.save()

    newslot.create_concurrent_timeslots()

    if "HTTP_ACCEPT" in request.META and "text/json" in request.META['HTTP_ACCEPT']:
        return HttpResponseRedirect(
            reverse(timeslot_dayurl, args=[meeting.number, newroom.pk]))
    else:
        return HttpResponseRedirect(
            reverse(edit_timeslots, args=[meeting.number]))

@group_required('Secretariat')
def timeslot_delslot(request, meeting, slotid):
    # authorization was enforced by the @group_require decorator above.
    slot = get_object_or_404(meeting.timeslot_set, pk=slotid)

    # this will delete self as well.
    slot.delete_concurrent_timeslots()
    return HttpResponse('{"error":"none"}', status = 200)

def timeslot_slotsurl(request, num=None):
    meeting = get_meeting(num)

    if request.method == 'GET':
        return timeslot_slotlist(request, meeting)
    elif request.method == 'POST':
        return timeslot_addslot(request, meeting)

    # unacceptable reply
    return HttpResponse(status=406)

def timeslot_sloturl(request, num=None, slotid=None):
    meeting = get_meeting(num)

    if request.method == 'GET':
        slot = get_object_or_404(meeting.timeslot_set, pk=slotid)
        return HttpResponse(json.dumps(slot.json_dict(request.get_host_protocol())),
                            mimetype="text/json")
    elif request.method == 'PUT':
        # not yet implemented!
        return timeslot_updslot(request, meeting)
    elif request.method == 'DELETE':
        return timeslot_delslot(request, meeting, slotid)

##########################################################################################################################
## Agenda Editing API functions
##########################################################################################################################

# this get_info needs to be replaced once we figure out how to get rid of silly
# ajax state we are passing through.
# XXX believed to be obsolete now?
@dajaxice_register
def get_info(request, scheduledsession_id=None, active_slot_id=None, timeslot_id=None, session_id=None):#, event):

    try:
        session = Session.objects.get(pk=int(session_id))
    except Session.DoesNotExist:
        logging.debug("No ScheduledSession was found for id:%s" % (session_id))
        # in this case we want to return empty the session information and perhaps indicate to the user there is a issue.
        return


    sess1 = session.json_dict(request.get_host_protocol())
    sess1['active_slot_id'] = str(active_slot_id)
    sess1['ss_id']          = str(scheduledsession_id)
    sess1['timeslot_id']    = str(timeslot_id)

    return json.dumps(sess1, sort_keys=True, indent=2)

def session_json(request, num, sessionid):
    meeting = get_meeting(num)

    try:
        session = meeting.session_set.get(pk=int(sessionid))
    except Session.DoesNotExist:
        return json.dumps({'error':"no such session %s" % sessionid})

    sess1 = session.json_dict(request.get_host_protocol())
    return HttpResponse(json.dumps(sess1, sort_keys=True, indent=2),
                        mimetype="text/json")

def meeting_json(request, meeting_num):
    meeting = get_meeting(meeting_num)
    #print "request is: %s\n" % (request.get_host_protocol())
    return HttpResponse(json.dumps(meeting.json_dict(request.get_host_protocol()),
                                   sort_keys=True, indent=2),
                        mimetype="text/json")

# current dajaxice does not support GET, only POST.
# it has almost no value for GET, particularly if the results are going to be
# public anyway.
def session_constraints(request, num=None, sessionid=None):
    meeting = get_meeting(num)

    print "Getting meeting=%s session contraints for %s" % (num, sessionid)
    try:
        session = meeting.session_set.get(pk=int(sessionid))
    except Session.DoesNotExist:
        return json.dumps({"error":"no such session"})

    constraint_list = session.constraints_dict(request.get_host_protocol())

    json_str = json.dumps(constraint_list,
                          sort_keys=True, indent=2),
    #print "  gives: %s" % (json_str)

    return HttpResponse(json_str, mimetype="text/json")



