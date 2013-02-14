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



/* this function needs to be renamed... it should only deal with listeners who need to be unbound prior to rebinding. */
function listeners(){
    $('.meeting_event').unbind('click'); // If we don't unbind it, things end up getting stacked, and tons of ajax things are sent. 
    $('.meeting_event').click(meeting_event_click);

    $('#info_location_select').unbind('change');
    $('#info_location_select').change(info_location_select_change);

    $('#info_name_select').unbind('change');
    $('#info_name_select').change(info_name_select_change);

}

/* the functionality of these listeners will never change so they do not need to be run twice  */
function static_listeners(){
    $('#CLOSE_IETF_MENUBAR').click(hide_ietf_menu_bar);
}

/* When one clicks something contained inside a 'meeting_event' we 
   traverse up the dom looking for the thing that contained the 
   .meeting_event class. In all cases, it should be a table with an 
   id. From this ID we are able to get the json object from 'meeting_objs'
   and from there ask django for more information
*/

var clicked_event;

var current_item = null;
var current_timeslot = null;
function meeting_event_click(event){
    if(current_item != null){
	$(current_item).css('background','');
	
    }
    if(last_item != null){
	$(last_item).css('background-color','');
    }
    
    var slot_id = $(event.target).closest('.agenda_slot').attr('id');
    var meeting_event_id = $(event.target).closest('.meeting_event').attr('id');
    
    console.log("meeting event click");
    console.log(event);
    clicked_event = event;
    console.log("event.taget.id",$(event).attr('id'));
    console.log("slot_id:", slot_id);
    slot = slot_status[slot_id];
    console.log(meeting_event_id);
    
    console.log(meeting_objs[meeting_event_id]);
    meeting_event_id = meeting_event_id.substring(8,meeting_event_id.length);
    if(slot) {
	for(var i = 0; i<slot.length; i++){
	    session_id = slot[i].session_id;
	    
	    $("#session_"+session_id).css('background-color',highlight);
	    
            
	    current_item = "#session_"+session_id;
	    current_timeslot = slot[i].timeslot_id;
	    
	    //				       {'meeting_obj':meeting_objs[session_id]},
            empty_info_table();

	    Dajaxice.ietf.meeting.get_info(fill_in_info,
                                           {   "active_slot_id": slot_id,
                                               "scheduledsession_id": slot[i].scheduledsession_id,
                                               "timeslot_id": slot[i].timeslot_id,
                                               "session_id": slot[i].session_id
                                               },
                                           dajaxice_error );
        }
    }
}

function dajaxice_error(a){
    console.log("dajaxice_error");
}

function fill_in_info(inp){
    console.log("fill_in_info");
    console.log(inp);

    if(inp == null || inp == "None"){
	console.log("null returned");
	empty_info_table();
    }
    $('#ss_info').html(generate_info_table(inp));
}
var menu_bar_hidden = false;
function hide_ietf_menu_bar(){
    $('#IETF_MENUBAR').toggle('slide',"",100);
    if(menu_bar_hidden){
	menu_bar_hidden = false;
	$('.wrapper').css('width','auto');
	$('.wrapper').css('margin-left','160px');
	$('#CLOSE_IETF_MENUBAR').html("<");

    }
    else{
	menu_bar_hidden = true;
	$('.wrapper').css('width','auto');
	$('.wrapper').css('margin-left','0px');
	$('#CLOSE_IETF_MENUBAR').html(">");
    }
}

var last_item = null;
function info_location_select_change(){
    if(last_item != null){
	console.log(last_item);
	$(last_item).css('background-color','');
    }
    last_item = '#'+$('#info_location_select').val();
    $('#'+$('#info_location_select').val()).css('background-color',highlight);
}

var last_name_item = null;
function info_name_select_change(){
    if(last_name_item != null){
	console.log(last_name_item);
	$(last_name_item).css('background-color','');
    }
    last_name_item = '#'+$('#info_name_select').val();
    $('#'+$('#info_name_select').val()).css('background-color',highlight);
}


/* create the droppable */
function droppable(){
    $(function() {
	/* the thing that is draggable */
	$( ".meeting_event").draggable({
	    appendTo: "body",
	    helper: "clone",
	    drag: drag_drag,
	});

	$( "#sortable-list").droppable({
	    over : drop_over,
	    activate: drop_activate,
	    out : drop_out,
	    drop : drop_bucket,
	    start: drop_start,
	})
    
	$("#meetings td").droppable({
	    over :drop_over,
	    activate:drop_activate,
	    out :drop_out,
	    drop : drop_drop,
	    create: drop_create,
	    start: drop_start,

	}); // end $(#meetings td).droppable
    }); // end function()
} // end droppable()


/* what happens when we drop the session onto a timeslot. */
function drop_drop(event, ui){
    console.log("------ drop drop --------");
    var temp_id = ui.draggable.attr('id');
    console.log("event "+event.id+" with ui.id "+temp_id);
    temp_id = temp_id.substring(8,temp_id.length);
    var slot_idd = $(this).attr('id');
    console.log("slot_idd: "+slot_idd);
    console.log("slot_status:"); console.log(slot_status[slot_idd]);

    // make a json with the new values to inject into the event
    var event_json = id_to_json(slot_idd); 
    var session_obj = meeting_objs[temp_id];


    // find an empty slot.
    slot = slot_status[slot_idd];
    // slot_status[slot_idd] will be undefined if nothing can EVER be put there. 
    if(!slot) return;

    var status_obj; 
    var found = false;
    for(var i = 0; i<slot.length; i++) {
        if(slot[i].empty != false &&
           slot[i].empty != "False") { // refactor to use check_free(inp.id)
            found = true;
            status_obj = slot[i];
        }
    }

    /* no available slot */
    if(!found) return;
		
    // we are good, the slot is empty.
    status_obj.empty = false; // it's going to be full now....
    status_obj.session_id = temp_id;

    console.log("session_obj:"); console.log(session_obj);
    console.log("ss.id: "+status_obj.scheduledsession_id);
    
    if(meeting_objs[temp_id].slot_status_key == null){ // we are coming from a bucket list
        session_obj.slot_status_key = slot_idd;
    } else {
        // how do we deal with the case that there are two things in a slot?
        status_obj.empty = true;
        $("#"+session_obj.slot_status_key).css('background',color_droppable_empty_slot);
        session_obj.slot_status_key = slot_idd;
    }
    
    
    var eTemplate = event_template(session_obj.title, session_obj.description, session_obj.session_id);
    $(this).append(eTemplate);
    ui.draggable.remove();
    ui.draggable.css("background",""); // remove the old one. 	
    $(this).css("background","");
    
    Dajaxice.ietf.meeting.update_timeslot(dajaxice_callback,
                                          {
                                              'session_id':session_obj.session_id,
                                              'scheduledsession_id': status_obj.scheduledsession_id,
                                          });
    
    droppable();
    listeners();

}

/* what happens when we drop the session onto the bucket list
   (thing named "unassigned events") */

function drop_bucket(event,ui){
	console.log("drop_bucket called");
	var temp_session_id = ui.draggable.attr('id'); // the django session id
	var idd = temp_session_id.substring(8,temp_session_id.length);
	var session_obj =  meeting_objs[idd];

	slot_status[session_obj.slot_status_key].session_id = null;
	slot_status[session_obj.slot_status_key].empty = true;
	$("#"+session_obj.slot_status_key).css('background',color_droppable_empty_slot);
	session_obj.placed = false;
	session_obj.slot_status_key = null;

	var eTemplate = event_template(session_obj.title, session_obj.description, session_obj.session_id);
	$(this).append(eTemplate);

	
	ui.draggable.remove();
	// dajaxice call should say this session has no timeslot.  
    // Dajaxice.ietf.meeting.update_timeslot(dajaxice_callback,{'new_event':new_event}); /* dajaxice_callback does nothing */ 
	droppable();
	listeners();

}

/* first thing that happens when we grab a meeting_event */
function drop_activate(event, ui){
    $(event.draggable).css("background",dragging_color);
}


/* what happens when moving a meeting event over something that is 'droppable' */
function drop_over(event, ui){
    if(check_free(this)){
	$(this).css("background",highlight);
    }
    $(ui.draggable).css("background",dragging_color);
    $(event.draggable).css("background",dragging_color);
}

/* when we have actually dropped the meeting event */
function drop_out(event, ui){
	console.log(this);
    if(check_free(this)){
		$(this).css("background",color_droppable_empty_slot);
		console.log("empty");
    }
}


/* functions here are not used at the moment */
function drop_create(event,ui){
}

function drop_start(event,ui){
}

function drag_drag(event, ui){
}

/* ??? */
function handelDrop(event, ui){
    $(d).append(ui.draggable);
}


/*
 * Local Variables:
 * c-basic-offset:4
 * End:
 */
