import re
import sys
from django.test import TestCase
#from ietf.person.models import Person
from django.contrib.auth.models import User
from django.test.client import Client
from ietf.meeting.models  import TimeSlot, Session, ScheduledSession
from auths import auth_joeblow, auth_wlo, auth_ietfchair, auth_ferrel

class ViewTestCase(TestCase):
    fixtures = [ 'names.xml',  # ietf/names/fixtures/names.xml for MeetingTypeName, and TimeSlotTypeName
                 'meeting83.json',
                 'workinggroups.json',
                 'groupgroup.json',
                 'person.json', 'users.json' ]

    def test_nameOfClueWg(self):
        clue_session = Session.objects.get(pk=2194)
        self.assertEqual(clue_session.short_name, "clue")
        
    def test_nameOfIEPG(self):
        iepg_session = Session.objects.get(pk=2288)
        self.assertEqual(iepg_session.short_name, "IEPG Meeting")
        
    def test_nameOfEdu1(self):
        edu1_session = Session.objects.get(pk=2274)
        self.assertEqual(edu1_session.short_name, "Tools for Creating Internet-Drafts Tutorial")

    def test_scheduledslot_clue(self):
        iepg_ss = ScheduledSession.objects.get(pk=2413)
        self.assertEqual(iepg_ss.session_js_str, ''',"session_id":"2194"''')
        
    def test_js_identifier_clue(self):
        iepg_ss = ScheduledSession.objects.get(pk=2413)
        slot = iepg_ss.timeslot
        self.assertEqual(slot.js_identifier, "252b_2012-03-27_0900")
        

        
