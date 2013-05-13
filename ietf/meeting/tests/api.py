import base64
import sys, datetime
from django.test import TestCase, Client

#from ietf.person.models import Person
from django.contrib.auth.models import User
from ietf.meeting.models  import TimeSlot, Session, ScheduledSession, Meeting
from ietf.ietfauth.decorators import has_role
from auths import auth_joeblow, auth_wlo, auth_ietfchair, auth_ferrel
from django.utils import simplejson as json
from ietf.meeting.helpers import get_meeting

class ApiTestCase(TestCase):
    fixtures = [ 'names.xml',  # ietf/names/fixtures/names.xml for MeetingTypeName, and TimeSlotTypeName
                 'meeting83.json',
                 'constraint83.json',
                 'workinggroups.json',
                 'groupgroup.json',
                 'person.json', 'users.json' ]

    def test_noAuthenticationUpdateAgendaItem(self):
        ts_one = TimeSlot.objects.get(pk=2371)
        ts_two = TimeSlot.objects.get(pk=2372)
        ss_one = ScheduledSession.objects.get(pk=2371)

        # confirm that it has old timeslot value
        self.assertEqual(ss_one.timeslot, ts_one)

        # move this session from one timeslot to another.
        self.client.post('/dajaxice/ietf.meeting.update_timeslot/', {
            'argv': '{"session_id":"2371","scheduledsession_id":"2372"}'
            })

        # confirm that without login, it does not have new value
        ss_one = ScheduledSession.objects.get(pk=2371)
        self.assertEqual(ss_one.timeslot, ts_one)

    def atest_noAuthorizationUpdateAgendaItem(self):
        ts_one = TimeSlot.objects.get(pk=2371)
        ts_two = TimeSlot.objects.get(pk=2372)
        ss_one = ScheduledSession.objects.get(pk=2371)

        # confirm that it has old timeslot value
        self.assertEqual(ss_one.timeslot, ts_one)

        self.assertTrue(0)
        # move this session from one timeslot to another.
        self.client.post('/dajaxice/ietf.meeting.update_timeslot/', {
            'argv': '{"session_id":"2371","scheduledsession_id":"2372"}}'
            })

        # confirm that without login, it does not have new value
        ss_one = ScheduledSession.objects.get(pk=2371)
        self.assertEqual(ss_one.timeslot, ts_one)


    def test_wrongAuthorizationUpdateAgendaItem(self):
        s2157 = Session.objects.get(pk=2157)
        ss_one = ScheduledSession.objects.get(pk=2371)
        ss_two = ScheduledSession.objects.get(pk=2372)

        old_two_s = ss_two.session

        # confirm that it has old timeslot value
        self.assertEqual(ss_one.session, s2157)

        # move this session from one timeslot to another.
        self.client.post('/dajaxice/ietf.meeting.update_timeslot/', {
            'argv': '{"session_id":"2157", "scheduledsession_id":"2372"}'
            }, **auth_joeblow)

        # confirm that without login, it does not have new value
        ss_one = ScheduledSession.objects.get(pk=2371)
        self.assertEqual(ss_one.session, s2157)

        # confirm that it new scheduledsession object still has no value.
        ss_two = ScheduledSession.objects.get(pk=2372)
        self.assertEqual(ss_two.session, old_two_s)

    def test_wloUpdateAgendaItem(self):
        s2157 = Session.objects.get(pk=2157)
        ss_one = ScheduledSession.objects.get(pk=2371)

        # confirm that it has old timeslot value
        self.assertEqual(ss_one.session, s2157)

        # move this session from one timeslot to another.
        self.client.post('/dajaxice/ietf.meeting.update_timeslot/', {
            'argv': '{"session_id":"2157", "scheduledsession_id":"2372"}'
            }, **auth_wlo)

        # confirm that it new scheduledsession object has new session.
        ss_two = ScheduledSession.objects.get(pk=2372)
        self.assertEqual(ss_two.session, s2157)

        # confirm that it old scheduledsession object has no session.
        ss_one = ScheduledSession.objects.get(pk=2371)
        self.assertEqual(ss_one.session, None)

    def test_chairUpdateAgendaItem(self):
        s2157 = Session.objects.get(pk=2157)
        ss_one = ScheduledSession.objects.get(pk=2371)

        # confirm that it has old timeslot value
        self.assertEqual(ss_one.session, s2157)

        # move this session from one timeslot to another.
        self.client.post('/dajaxice/ietf.meeting.update_timeslot/', {
            'argv': '{"session_id":"2157", "scheduledsession_id":"2372"}'
            }, **auth_ietfchair)

        # confirm that it new scheduledsession object has new session.
        ss_two = ScheduledSession.objects.get(pk=2372)
        self.assertEqual(ss_two.session, s2157)

        # confirm that it old scheduledsession object has no session.
        ss_one = ScheduledSession.objects.get(pk=2371)
        self.assertEqual(ss_one.session, None)


    def test_anyoneGetConflictInfo(self):
        s2157 = Session.objects.get(pk=2157)

        # move this session from one timeslot to another.
        resp = self.client.get('/meeting/83/session/2157/constraints.json')
        conflicts = json.loads(resp.content)
        self.assertNotEqual(conflicts, None)

    def test_getMeetingInfoJson(self):
        resp = self.client.get('/meeting/83.json')
        mtginfo = json.loads(resp.content)
        self.assertNotEqual(mtginfo, None)

    def test_getRoomJson(self):
        mtg83 = get_meeting(83)
        rm243 = mtg83.room_set.get(name = '243')

        resp = self.client.get('/meeting/83/room/%s.json' % rm243.pk)
        rm243json = json.loads(resp.content)
        self.assertNotEqual(rm243json, None)

    def test_createNewRoomNonSecretariat(self):
        mtg83 = get_meeting(83)
        rm221 = mtg83.room_set.filter(name = '221')
        self.assertEqual(len(rm221), 0)

        # try to create a new room.
        self.client.post('/meeting/83/rooms', {
                'name' : '221',
                'capacity': 50,
            }, **auth_joeblow)

        # see that in fact the room was not created
        rm221 = mtg83.room_set.filter(name = '221')
        self.assertEqual(len(rm221), 0)

    def test_createNewRoomSecretariat(self):
        mtg83 = get_meeting(83)
        rm221 = mtg83.room_set.filter(name = '221')
        self.assertEqual(len(rm221), 0)

        timeslots = mtg83.timeslot_set.all()
        timeslot_initial_len = len(timeslots)
        self.assertTrue(timeslot_initial_len>0)

        # try to create a new room
        self.client.post('/meeting/83/rooms', {
                'name' : '221',
                'capacity': 50,
            }, **auth_wlo)

        # see that in fact wlo can create a new room.
        rm221 = mtg83.room_set.filter(name = '221')
        self.assertEqual(len(rm221), 1)

        timeslots = mtg83.timeslot_set.all()
        timeslot_final_len = len(timeslots)
        self.assertEqual((timeslot_final_len - timeslot_initial_len), 26)

    def test_deleteNewRoomSecretariat(self):
        mtg83 = get_meeting(83)
        rm243 = mtg83.room_set.get(name = '243')
        slotcount = len(rm243.timeslot_set.all())
        self.assertNotEqual(rm243, None)

        timeslots = mtg83.timeslot_set.all()
        timeslot_initial_len = len(timeslots)
        self.assertTrue(timeslot_initial_len>0)

        # try to delete a new room
        self.client.delete('/meeting/83/room/%s.json' % (rm243.pk), **auth_wlo)

        # see that in fact wlo can delete an existing room.
        rm243 = mtg83.room_set.filter(name = '243')
        self.assertEqual(len(rm243), 0)

        timeslots = mtg83.timeslot_set.all()
        timeslot_final_len = len(timeslots)
        self.assertEqual((timeslot_final_len-timeslot_initial_len), -slotcount)

    def atest_iesgNoAuthWloUpdateAgendaItem(self):
        ts_one = TimeSlot.objects.get(pk=2371)
        ts_two = TimeSlot.objects.get(pk=2372)
        ss_one = ScheduledSession.objects.get(pk=2371)

        # confirm that it has old timeslot value
        self.assertEqual(ss_one.timeslot, ts_one)

        self.do_auth_ietfchair
        # move this session from one timeslot to another.
        self.client.post('/dajaxice/ietf.meeting.update_timeslot/', {
            'argv': '{"session_id":"2371","scheduledsession_id":"2372"}'
            })

        self.assertTrue(0)
        # confirm that it has new timeslot value
        ss_one = ScheduledSession.objects.get(pk=2371)
        self.assertEqual(ss_one.timeslot, ts_two)

    def test_getGroupInfoJson(self):
        resp = self.client.get('/group/pkix.json')
        #print "json: %s" % (resp.content)
        mtginfo = json.loads(resp.content)
        self.assertNotEqual(mtginfo, None)

    def test_getSlotJson(self):
        mtg83 = get_meeting(83)
        slot0 = mtg83.timeslot_set.all()[0]

        resp = self.client.get('/meeting/83/timeslot/%s.json' % slot0.pk)
        slot0json = json.loads(resp.content)
        self.assertNotEqual(slot0json, None)

    def test_createNewSlotNonSecretariat(self):
        mtg83 = get_meeting(83)
        slot23 = mtg83.timeslot_set.filter(time=datetime.date(year=2012,month=3,day=23))
        self.assertEqual(len(slot23), 0)

        # try to create a new room.
        resp = self.client.post('/meeting/83/timeslots', {
                'type' : 'plenary',
                'name' : 'Workshop on Smart Object Security',
                'time' : '2012-03-23',
                'duration_days' : 0,
                'duration_hours': 8,
                'duration_minutes' : 0,
                'duration_seconds' : 0,
            }, **auth_joeblow)

        self.assertEqual(resp.status_code, 403)
        # see that in fact the room was not created
        slot23 = mtg83.timeslot_set.filter(time=datetime.date(year=2012,month=3,day=23))
        self.assertEqual(len(slot23), 0)

    def test_createNewSlotSecretariat(self):
        mtg83 = get_meeting(83)
        slot23 = mtg83.timeslot_set.filter(time=datetime.date(year=2012,month=3,day=23))
        self.assertEqual(len(slot23), 0)

        # try to create a new room.
        resp = self.client.post('/meeting/83/timeslots', {
                'type' : 'plenary',
                'name' : 'Workshop on Smart Object Security',
                'time' : '2012-03-23',
                'duration': '08:00:00',
            }, **auth_wlo)
        self.assertEqual(resp.status_code, 302)

        # see that in fact wlo can create a new timeslot
        mtg83 = get_meeting(83)
        slot23 = mtg83.timeslot_set.filter(time=datetime.date(year=2012,month=3,day=23))
        self.assertEqual(len(slot23), 11)

    def test_deleteNewSlotSecretariat(self):
        mtg83 = get_meeting(83)
        slot0 = mtg83.timeslot_set.all()[0]

        # try to delete a new room
        self.client.delete('/meeting/83/timeslot/%s.json' % (slot0.pk), **auth_wlo)

        # see that in fact wlo can delete an existing room.
        slot0n = mtg83.timeslot_set.filter(pk = slot0.pk)
        self.assertEqual(len(slot0n), 0)




