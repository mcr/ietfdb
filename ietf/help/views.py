# Copyright The IETF Trust 2007, All Rights Reserved

from django.template import RequestContext
from django.shortcuts import get_object_or_404, render_to_response

import debug

from ietf.doc.models import State, StateType


def index(request):
    types = StateType.objects.all()
    names = [ type.slug for type in types ]
    for type in types:
        if "-" in type.slug and type.slug.split('-',1)[0] in names:
            type.stategroups = None
        else:
            groups = StateType.objects.filter(slug__startswith=type.slug)
            type.stategroups =  [ g.slug[len(type.slug)+1:] for g in groups if not g == type ] or ""
                
    return render_to_response('help/index.html', {"types": types},
        context_instance=RequestContext(request))

def state(request, doc, type=None):
    slug = "%s-%s" % (doc,type) if type else doc
    debug.show('slug')
    statetype = get_object_or_404(StateType, slug=slug)
    states = State.objects.filter(used=True, type=statetype).order_by('order')
    return render_to_response('help/states.html', {"doc": doc, "type": statetype, "states":states},
        context_instance=RequestContext(request))

