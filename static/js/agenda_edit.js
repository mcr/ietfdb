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
var days = [];

/********* colors ************************************/

var highlight = "red"; // when we click something and want to highlight it.
var dragging_color = "blue"; // color when draging events.
var none_color = '';  // when we reset the color. I believe doing '' will force it back to the stylesheet value. 
var color_droppable_empty_slot = 'rgb(0, 102, 153)';

/****************************************************/


/////////////-END-GLOBALS-///////////////////////////////////////

/* refactor this out into the html */
$(document).ready(function() {
    initStuff();
    $("#CLOSE_IETF_MENUBAR").click();

});

/* initStuff() 
   This is ran at page load and sets up the entire page. 
*/
function initStuff(){
    log("initstuff() ran");
    setup_slots();
    log("setup_slots() ran");
    droppable();
    log("droppable() ran");
    load_events();
    log("load_events() ran");

    listeners();
    static_listeners();
    log("listeners() ran");
    calculate_name_select_box();
}


function dajaxice_callback(message){

}

function print_all_ss(objs){
    console.log(objs)
}
function get_ss(){
    Dajaxice.ietf.meeting.get_scheduledsessions(print_all_ss);
}






