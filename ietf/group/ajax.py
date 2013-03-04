from django.utils import simplejson as json
from dajaxice.core import dajaxice_functions
from dajaxice.decorators import dajaxice_register
from ietf.ietfauth.decorators import group_required
from django.shortcuts import get_object_or_404
from django.http import HttpResponseRedirect, HttpResponse, Http404

from ietf.group.models import Group
import datetime
import logging

logging.basicConfig(filename='ajax.log',level=logging.DEBUG) # this is not okay for production, put the log somewhere useful.

log = logging.getLogger(__name__)

def group_json(request, groupname):
    group = get_object_or_404(Group, acronym=groupname)

    #print "group request is: %s\n" % (request.get_host_protocol())
    return HttpResponse(json.dumps(group.json_dict(request.get_host_protocol()),
                                   sort_keys=True, indent=2),
                        mimetype="text/json")

