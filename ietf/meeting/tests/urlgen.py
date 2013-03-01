import base64
import sys
from django.test import TestCase, Client

from django.contrib.auth.models import User
from ietf.person.models import Person
from ietf.meeting.models  import Meeting, TimeSlot, Session, ScheduledSession
#from ietf.ietfauth.decorators import has_role
#from auths import auth_joeblow, auth_wlo, auth_ietfchair, auth_ferrel

class UrlGenTestCase(TestCase):
    fixtures = [ 'names.xml',  # ietf/names/fixtures/names.xml for MeetingTypeName, and TimeSlotTypeName
                 'meeting83.json',
                 'workinggroups.json',
                 'groupgroup.json',
                 'person.json', 'users.json' ]

    def test_meetingGeneratesUrl(self):
        mtg83 = Meeting.objects.get(pk=83)
        hostport = "http://datatracker.ietf.org"
        self.assertEqual(mtg83.url(hostport), "http://datatracker.ietf.org/meeting/83.json")

