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

function slot_obj(empty, timeslot_id, session_id, room, date, time, domid) {
  this.empty       = empty;
  this.timeslot_id = timeslot_id;
  this.session_id  = session_id;
  this.date        = date;
  this.time        = time;
  this.room        = room;
  this.short_string = short_string;
  if(domid) {
    this.domid = domid;
  } else {
    this.domid = json_to_id(this);
    console.log("gen "+timeslot_id+" is domid: "+this.domid);
  }
}

function event_obj(title, description, session_id, owner){
    this.title = title;
    this.description = description;
    this.session_id = session_id;
    this.owner = owner;
    this.last_timeslot_id = null;
}


/* event_obj functions. */

/* function for event_obj that will produce a short string version of this obj. */
function short_string(){
    fmt_time = (this.date).split('-');
    d = new Date(fmt_time[0],fmt_time[1], fmt_time[2]);
    t = "";
    t = $.datepicker.formatDate('DD', d);
    t = t.toString() + ", "+ this.time + ", " + upperCaseWords(this.room);
    return t;
}
