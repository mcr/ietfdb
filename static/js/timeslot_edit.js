
/*
*   agenda_listeners.js
*
*   Orlando Project: Credil 2013 ( http://credil.org/ )
*   Author: Justin Hornosty ( justin@credil.org )
*
*
*   This file should contain functions relating to
*   jquery ui droppable ( http://jqueryui.com/droppable/ )
*   and other interactions.
*
*/




//////////////-GLOBALS----////////////////////////////////////////

var meeting_objs = {};    // contains a list of session objects
var slot_status = {};     // the status of the slot, in format { room_year-month-day_hour: { free: t/f, timeslotid: id } }

var group_objs = {};      // list of working groups

var days = [];
var legend_status = {};   // agenda area colors.

var duplicate_sessions = {};
/********* colors ************************************/

var highlight = "red"; // when we click something and want to highlight it.
var dragging_color = "blue"; // color when draging events.
var none_color = '';  // when we reset the color. I believe doing '' will force it back to the stylesheet value.
var color_droppable_empty_slot = 'rgb(0, 102, 153)';

// these are used for debugging only.
var last_json_txt   = "";   // last txt from a json call.
var last_json_reply = [];   // last parsed content

var hidden_rooms = [];
var total_rooms = 0; // the number of rooms
var hidden_days = [];
var total_days = 0; // the number of days
/****************************************************/

/////////////-END-GLOBALS-///////////////////////////////////////

/* refactor this out into the html */
$(document).ready(function() {
    init_timeslot_edit();

    $("#CLOSE_IETF_MENUBAR").click();
});

/*
   init_timeslot_editf()
   This is ran at page load and sets up the entire page.
*/
function init_timeslot_edit(){
    log("initstuff() ran");
    setup_slots();
    log("setup_slots() ran");
    fill_timeslots();
}

function fill_timeslots() {
    $.each(slot_status, function(key) {
        ssid_arr = slot_status[key];

	for(var q = 0; q<ssid_arr.length; q++){
	    ssid = ssid_arr[q];
            insert_timeslotedit_cell(ssid);
	}
    });
}

function insert_timeslotedit_cell(ssid) {
    domid  = ssid.domid
    slotid = ssid.timeslot_id
    roomtype=ssid.roomtype
    slot_id = ("#"+domid)

    roomtypesession="";
    roomtypenonsession="";
    roomtypeplenary="";
    roomtypereserved="";
    roomtypeclass="";
    roomtypeunavailable="";
    //console.log("domid: "+domid+" has roomtype: "+roomtype)
    $(slot_id).removeClass("agenda_slot_unavailable")

    if(roomtype == "session") {
        roomtypesession="selected";
        roomtypeclass="agenda_slot_session";
    } else if(roomtype == "non-session") {
        roomtypenonsession="selected";
        roomtypeclass="agenda_slot_non-session";
    } else if(roomtype == "plenary") {
        roomtypeplenary="selected";
        roomtypeclass="agenda_slot_plenary";
    } else if(roomtype == "reserved" || roomtype == "other") {
        roomtypereserved="selected";
        roomtypeclass="agenda_slot_other";
    } else {
        roomtypeunavailable="selected";
        roomtypeclass="agenda_slot_unavailable";
    }

    select_id = domid + "_select"
    html = "<form action=\"/some/place\" method=\"post\"><select id='"+select_id+"'>";
    html = html + "<option value='session'     "+roomtypesession+" id='option_"+domid+"_session'>session</option>";
    html = html + "<option value='non-session' "+roomtypenonsession+" id='option_"+domid+"_nonsession'>non-session</option>";
    html = html + "<option value='reserved'    "+roomtypereserved+" id='option_"+domid+"_reserved'>reserved</option>";
    html = html + "<option value='plenary'     "+roomtypeplenary+" id='option_"+domid+"_plenary'>plenary</option>";
    html = html + "<option value='unavailable' "+roomtypeunavailable+" id='option_"+domid+"_unavailable'>unavailable</option>";
    html = html + "</select>";


    $(slot_id).html(html)
    $(slot_id).addClass(roomtypeclass)

    $("#"+select_id).change(function(eventObject) {
	                   start_spin();
                           console.log("setting id: #"+select_id+" with "+eventObject);
                           Dajaxice.ietf.meeting.update_timeslot_purpose(
                               function(json) {
                                   if(json == "") {
                                       console.log("No reply from server....");
                                   } else {
                                       stop_spin();
                                       for(var key in json) {
	                                   ssid[key]=json[key];
                                       }
                                       insert_timeslotedit_cell(ssid);
                                   }
                               },
			       {
				   'scheduledsession_id': ssid.scheduledsession_id,
                                   'purpose': $("#"+select_id).val(),
			       });
                           $(slot_id).removeClass(roomtypeclass);
                       });

}

/*
 * Local Variables:
 * c-basic-offset:4
 * End:
 */

