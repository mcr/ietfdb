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


function slot_obj(scheduledsession_id, empty, timeslot_id, session_id, room, time, date, domid) {
  this.scheduledsession_id = scheduledsession_id;
  this.empty       = empty;
  this.timeslot_id = timeslot_id;
  this.session_id  = session_id;
  this.date        = date;
  this.time        = time;
  this.room        = room;

  var d = new Date(this.date);
  var t = d.getUTCDay();
  //console.log("short_string "+this.date+" gives "+t);
    if(this.room == "Unassigned"){
	this.short_string = "Unassigned";
    }
    else{
	this.short_string = daysofweek[t] + ", "+ this.time + ", " + upperCaseWords(this.room);
    }
  if(domid) {
    this.domid = domid;
  } else {
    this.domid = json_to_id(this);
    console.log("gen "+timeslot_id+" is domid: "+this.domid);
  }
}

// SESSION OBJECTS
// really session_obj.
function event_obj(title, description, session_id, owner, group_id, area) {
    // this.slug = slug;
    this.title = title;
    this.description = description;
    this.session_id = session_id;
    this.owner = owner;
    this.area  = area;
    this.group_id = group_id;
    this.last_timeslot_id = null;
    this.slot_status_key = null;
    this.href       = false;
    this.group_obj  = false;
}

event_obj.prototype.load_session_obj = function() {
    if(!this.group_href) {
        newobj = retrieve_session_by_id(this.session_id);
        if(newobj) {
            $.extend(this, newobj);
        }
    }
}

event_obj.prototype.group = function() {
    this.load_session_obj();
    if(!this.group_obj) {
        console.log("looking for "+this.group_href);
        this.group_obj = find_group_by_href(this.group_href);
    }
    // now have this.group_href.
    return this.group_obj;
}

// GROUP OBJECTS
function make_group_obj(obj) {
}

function find_group_by_href(href) {
    if(!group_objs[href]) {
        retrieve_group_by_href(href);
    }
    return group_objs[href];
}

// SESSION CONFLICT OBJECTS
// take an object and add attribuets so that it becomes a session_conflict_obj.
function make_session_conflict_obj(session, obj) {
    obj.conflict_view = function() {
        return "<div class='conflict-"+this.conflict_type+"' id='"+this.id+"'>"+this.othergroup.name+"</div>";
    };

    if(obj.source == session.href) {
        obj.thisgroup  = session.group();
        obj.othergroup = find_group_by_href(obj.target);
    } else {
        obj.thisgroup  = session.group();
        obj.othergroup = find_group_by_href(obj.source);
    }
}


/*
 * Local Variables:
 * c-basic-offset:4
 * End:
 */

