/*
,----
| 
|   FILE: agenda_objects.js
|    
|   AUTHOR: Justin Hornosty ( justin@credil.org ) 
|     Orlando Project <-> Credil, 2012 ( credil.org )
|   
|   Description: 
|      Contains the objects relating to django's models. 
|      Manulaption and helper functions are also located here.
|      Display logic should be contained in credil_agenda.js ( this should be renamed )
|
|   Functions:
|      - check_delimiter(inp)
|      - upperCaseWords(inp)
|      
|
|      - event_obj:
|          - short_string()
|
`----
*/



function slot(){
}

 
/* tests short_string */
function test_ss(){
    e = meeting_objs['2656'];
    return e.short_string();
}

/* 
   check_delimiter(inp), where inp is a string.
       returns char. 

   checks for what we should split a string by. 
   mainly we are checking for a '/' or '-' character
   
   Maybe there is a js function for this. doing 'a' in "abcd" does not work.
 */ 
function check_delimiter(inp){
    for(var i =0; i<inp.length; i++){
	if(inp[i] == '/'){
	    return '/';
	}
	else if(inp[i] == '-'){
	    return '-';
	}
    }
    return ' ';

}

/* 
   upperCaseWords(inp), where inp is a string.
       returns string
       
   turns the first letter of each word in a string to uppercase 
   a word is something considered be something defined by the function
   check_delimiter(). ( '/' , '-' , ' ' )
*/
function upperCaseWords(inp){
    var newStr = "";
    var split = inp.split(check_delimiter(inp));
    
	for(i=0; i<split.length; i++){
		newStr = newStr+split[i][0].toUpperCase();
		newStr = newStr+split[i].slice(1,split[i].length);
		
		if(i+1 < split.length){ // so we don't get a extra space
			newStr = newStr+" ";
		}
    }
    
	return newStr;
    
}

var daysofweek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ScheduledSession is DJANGO name for this object, but needs to be renamed.
// It represents a TimeSlot that can be assigned in this schedule.
function ScheduledSlot() {}

function slot_obj(scheduledsession_id, empty, timeslot_id, session_id, room, time, date, domid) {
    ss = new ScheduledSlot();
    ss.scheduledsession_id = scheduledsession_id;
    ss.empty       = empty;
    ss.timeslot_id = timeslot_id;
    ss.session_id  = session_id;
    ss.date        = date;
    ss.time        = time;
    ss.room        = room;
    
    var d = new Date(ss.date);
    var t = d.getUTCDay();
    //console.log("short_string "+ss.date+" gives "+t);
    if(ss.room == "Unassigned"){
	ss.short_string = "Unassigned";
    }
    else{
	ss.short_string = daysofweek[t] + ", "+ ss.time + ", " + upperCaseWords(ss.room);
    }
    if(domid) {
	ss.domid = domid;
    } else {
	ss.domid = json_to_id(this);
	console.log("gen "+timeslot_id+" is domid: "+ss.domid);
    }
    return ss;
}

ScheduledSlot.prototype.session = function() {
    if(this.session_id != undefined) {
	return meeting_objs[this.session_id];
    } else {
	return undefined;
    }
};


// SESSION OBJECTS
// really session_obj.
function Session() {
    this.constraints = {};
    this.last_timeslot_id = null;
    this.slot_status_key = null;
    this.href       = false;
    this.group_obj  = false;
}

function event_obj(title, description, session_id, owner, group_id, area) {
    session = new Session();

    // this.slug = slug;
    session.title = title;
    session.description = description;
    session.session_id = session_id;
    session.owner = owner;
    session.area  = area;
    session.group_id = group_id;
    session.loaded = false;
    session.href = meeting_base_url+'/session/'+session_id+".json";
    return session;
};


Session.prototype.load_session_obj = function(andthen, arg) {
    if(!this.loaded) {
	var oXMLHttpRequest = XMLHttpGetRequest(this.href, true);
	var session = this; // because below, this==XMLHTTPRequest
	oXMLHttpRequest.onreadystatechange = function() {
	    if (this.readyState == XMLHttpRequest.DONE) {
		try{
		    last_json_txt = this.responseText;
		    session_obj   = JSON.parse(this.responseText);
		    //console.log("parsed: "+constraint_list);
		    last_json_reply = session_obj;
		    $.extend(session, session_obj);
		    session.loaded = true;
		    if(andthen != undefined) {
			andthen(session, true, arg);
		    }
		}
		catch(exception){
		    console.log("exception: "+exception);
		    if(andthen != undefined) {
			andthen(session, false, arg);
		    }
		}
	    }
	};
	oXMLHttpRequest.send();
    } else {
	if(andthen != undefined) {
	    andthen(this, true, arg);
	}
    }
};

function andthen_alert(object, result, arg) {
    alert("result: "+result+" on obj: "+object);
};

Session.prototype.generate_info_table = function(ss) {
    $("#info_grp").html(this.group_acronym);
    $("#info_name").html(name_select_html);
    $("#info_area").html("<span class='"+this.area.toUpperCase()+"-scheme'>"+this.area+"</span>");
    $("#info_duration").html(this.requested_duration);

    $("#info_location").html(generate_select_box()+"<button id='info_location_set'>set</button>");

    // XXX we use *GLOBAL* current_timeslot rather than ss.timeslot_id!!!
    $("#info_name_select").val(ss.timeslot_id);
    $("#info_name_select").val($("#info_name_select_option_"+current_timeslot).val());

    var temp_1 = $("#info_name_select_option_"+current_timeslot).val();
    $("#info_name_select_option_"+ss.scheduledsession_id).css('background-color',highlight);

    $("#info_location_select").val(ss.timeslot_id);
    //console.log("git "+"#info_location_select_option_"+this.timeslot_id);
    $("#info_location_select").val($("#info_location_select_option_"+ss.timeslot_id).val());

    $("#"+ss.timeslot_id).css('background-color',highlight);

    listeners();
    
    $("#info_responsible").html(this.responsible_ad);
    $("#info_requestedby").html(this.requested_by +" ("+this.requested_time+")");
};


Session.prototype.group = function(andthen) {
    if(!this.group_obj) {
	this.group_obj = new Group();
        console.log("looking for "+this.group_href);
	this.group_obj.load_group_obj(this.group_href);
    }
    return this.group_obj;
};

Session.prototype.retrieve_constraints_by_session = function(andthen) {
    if(this.constraints) {
       var session_obj = this;

       var oXMLHttpRequest = XMLHttpGetRequest(meeting_base_url+'/session/'+session_obj.session_id+"/constraints.json", true);

       oXMLHttpRequest.onreadystatechange = function() {
	   //console.log("state: "+this.readyState);
	   if (this.readyState == XMLHttpRequest.DONE) {
	       //console.log("became ready");
	       try{
		   //console.log("parsing: "+this.responseText);
		   last_json_txt = this.responseText;
		   constraint_list = JSON.parse(this.responseText);
		   //console.log("parsed: "+constraint_list);
		   last_json_reply = constraint_list;
		   fill_in_constraints(session_obj, true,  constraint_list, andthen);
	       }
	       catch(exception){
		   console.log("exception: "+exception);
		   fill_in_constraints(session_obj, false, this.responseText, andthen);
	       }
	   }
       }
       oXMLHttpRequest.send();
    } else {
	/* everything is good, call continuation function */
	andthen(this);
    }
};



// GROUP OBJECTS
function Group() {}
Group.prototype.load_group_obj = function(href) {
    this.href = href;

    //console.log("group "+href);

    var oXMLHttpRequest = XMLHttpGetRequest(href, true);
    if(oXMLHttpRequest.readyState == XMLHttpRequest.DONE) {
        try{
            //console.log("parsing: "+oXMLHttpRequest.responseText);
            last_json_txt = oXMLHttpRequest.responseText;
            group_obj     = JSON.parse(oXMLHttpRequest.responseText);
	    if(group_obj) {
		//console.log("parsed: "+constraint_list);
		last_json_reply = group_obj;
		$.extend(this, group_obj);
	    }
        }
        catch(exception){
            console.log("retrieve group_by_href exception: "+exception);
        }
    }
    oXMLHttpRequest.send();
}

function find_group_by_href(href) {
    console.log("group href", href, group_objs[href]);
    if(!group_objs[href]) {
	group_objs[href]=new Group();
	group_objs[href].load_group_obj(href);
    }
    return group_objs[href];
}

// Constraint Objects
function Constraint() {
}

Constraint.prototype.conflict_view = function() {
    return "<div class='conflict-"+this.conflict_type+"' id='"+this.id+"'>"+this.othergroup.name+"</div>";
};


// SESSION CONFLICT OBJECTS
// take an object and add attributes so that it becomes a session_conflict_obj.
Session.prototype.add_constraint_obj = function(obj) {
    // turn this into a Constraint object
    obj.prototype = new Constraint();
    obj.session   = this;

    //console.log("session: ",JSON.stringify(session));
    //console.log("constraint: ",JSON.stringify(obj));

    if(obj.source == this.group.href) {
        obj.thisgroup  = this.group();
	console.log("session "+this.session_id,"target "+obj.target);
        obj.othergroup = find_group_by_href(obj.target);
    } else {
        obj.thisgroup  = this.group();
	console.log("session "+this.session_id,"source "+obj.source);
        obj.othergroup = find_group_by_href(obj.source);
    }

    var listname = obj.name;
    if(this.constraints[listname]==undefined) {
	this.constraints[listname]=[];
    }

    this.constraints[listname].push(obj);
};

function split_list_at(things, place) {
    var half1 = [];
    var half2 = [];
    var len = things.length;
    var i=0;
    for(i=0; i<place; i++) {
	half1[i] = things[i];
    }
    for(;i<len; i++) {
	half2[i] = things[i-place];
    }
    return [half1, half2];
}

function constraint_compare(a, b)
{
    if(a==undefined) {
	return -1;
    }
    if(b==undefined) {
	return 1;
    }
    return (a.othergroup.href > b.othergroup.href ? 1 : -1);
}

// this sorts the constraints into two columns such that the number of rows
// is half of the longest amount.
Session.prototype.sort_constraints = function() {
    // find longest amount
    var big = 0;
    if("conflicts" in this.constraints) {
	big = this.constraints.conflict.length;
    }

    if("conflic2" in this.constraints) {
	if(this.constraints.conflic2.length > big) {
	    big = this.constraints.conflic2.length;
	}
    }

    if("conflic3" in this.constraints) {
	if(this.constraints.conflic3.length > big) {
	    big = this.constraints.conflic3.length;
	}
    }

    this.conflict_half_count = Math.floor((big+1)/2);
    var half = this.conflict_half_count;

    console.log("sort half", half);

    this.conflicts = [];
    this.conflicts[1]=[[],[]]
    this.conflicts[2]=[[],[]]
    this.conflicts[3]=[[],[]]

    if("conflict" in this.constraints) {
	this.conflicts[1] = split_list_at(this.constraints.conflict.sort(constraint_compare), half);
    }

    if("conflic2" in this.constraints) {
	this.conflicts[2] = split_list_at(this.constraints.conflic2.sort(constraint_compare), half);
    }

    if("conflic3" in this.constraints) {
	this.conflicts[3] = split_list_at(this.constraints.conflic3.sort(constraint_compare), half);
    }
};


/*
 * Local Variables:
 * c-basic-offset:4
 * End:
 */

