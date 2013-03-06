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
    ss = new ScheduleSlot();
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
    session.href = meeting_base_url+'/session/'+scheduledtimeslot.session_id+".json";
    return session;
}


Session.prototype.load_session_obj = function(andthen, arg) {
    if(!this.loaded) {
	var oXMLHttpRequest = XMLHttpGetRequest(this.href, true);
	oXMLHttpRequest.onreadystatechange = function() {
	    if (this.readyState == XMLHttpRequest.DONE) {
		try{
		    last_json_txt = this.responseText;
		    session_obj   = JSON.parse(this.responseText);
		    //console.log("parsed: "+constraint_list);
		    last_json_reply = constraint_list;
		    $.extend(this, session_obj);
		    this.loaded = true;
		    if(andthen != undefined) {
			andthen(this, true, arg);
		    }
		}
		catch(exception){
		    console.log("exception: "+exception);
		    andthen(this, false, arg);
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
}

// GROUP OBJECTS
function Group() {}
Group.prototype.load_group_obj = function(href) {
    this.href = href;

    console.log("group "+href);

    var oXMLHttpRequest = XMLHttpGetRequest(href, true);
    if(oXMLHttpRequest.readyState == XMLHttpRequest.DONE) {
        try{
            console.log("parsing: "+oXMLHttpRequest.responseText);
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
function make_session_constraint_obj(session, obj) {
    // turn this into a Constraint object
    obj.prototype = new Constraint();
    obj.session   = session;

    //console.log("session: ",JSON.stringify(session));
    //console.log("constraint: ",JSON.stringify(obj));

    if(obj.source == session.href) {
        obj.thisgroup  = session.group();
	console.log("session "+session.session_id,"target "+obj.target);
        obj.othergroup = find_group_by_href(obj.target);
    } else {
        obj.thisgroup  = session.group();
	console.log("session "+session.session_id,"source "+obj.source);
        obj.othergroup = find_group_by_href(obj.source);
    }

    var listname = obj.name;
    if(session.constraints[listname]==undefined) {
	session.constraints[listname]=[];
    }
	
    session.constraints[listname].push(obj);
}


/*
 * Local Variables:
 * c-basic-offset:4
 * End:
 */

