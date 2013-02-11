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

/********* colors ************************************/

var highlight = "red"; // when we click something and want to highlight it.
var dragging_color = "blue"; // color when draging events.
var none_color = '';  // when we reset the color. I believe doing '' will force it back to the stylesheet value. 

/****************************************************/


/* this function needs to be renamed... it should only deal with listeners who need to be unbound prior to rebinding. */
function listeners(){
    $('.meeting_event').unbind('click'); // If we don't unbind it, things end up getting stacked, and tons of ajax things are sent. 
    $('.meeting_event').click(meeting_event_click);

    $('#info_location_select').unbind('change');
    $('#info_location_select').change(info_location_select_change);

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

var current_item = null;
function meeting_event_click(event){
    if(current_item != null){
	$(current_item).css('background','');
    }
    if(last_item != null){
	$(last_item).css('background-color','');
    }

    var slot_id = $(event.target).closest('.agenda_slot').attr('id');

    slot = slot_status[slot_id];
    if(slot) {
      session_id = slot.session_id;
      $("#session_"+session_id).css('background-color',highlight);
      
      current_item = "#session_"+session_id;
      
      Dajaxice.ietf.meeting.get_info(fill_in_info,
				     {'meeting_obj':meeting_objs[session_id]},
				     dajaxice_error );
    }
}

function dajaxice_error(a){
    console.log(this.ME_id);
    console.log(this);
    console.log("error");
    
}
function fill_in_info(inp){
    console.log(inp);
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
    var temp_id = ui.draggable.attr('id');
    console.log("event "+event.id+" with ui.id "+temp_id);
    var slot_idd = $(this).attr('id');

    // make a json with the new values to inject into the event
    var event_json = id_to_json(slot_idd); 

    new_slot = slot_status[temp_id];
    var old_id = "oldid";
    if(new_slot) {
      old_id = json_to_id(new_slot);
    } else {
      console.log("null new slot: "+temp_id);
      return;
    }
    var empty = check_free(this);
    
    if(empty){
	$(this).css("background","");
	var eTemplate = event_template( event.title, 
				        event.description,
				        event.session_id );
	
	$(this).append(eTemplate); // add the html code to the new slot.

	console.log($(this));

	ui.draggable.remove(); // remove the old one. 
	droppable(); // we need to run this again to toggle the new listeners

	log("id:   "+slot_idd)
	log("oldid:"+old_id)
	slot_status[slot_idd].empty = false;
	slot_status[old_id].empty = true;

	slot_status[slot_idd].session_id = event.id;

	//if ((new_event.last_timeslot_id == null) || (new_event.last_timeslot_id != new_event.timeslot_id)){
	//    new_event.last_timeslot_id = slot_status[old_id].timeslot_id
	//}
	//meeting_objs[temp_id] = new_event;
	//Dajaxice.ietf.meeting.update_timeslot(dajaxice_callback,{'new_event':new_event});
    }
    else{ // happens when you are moving the item to somewhere that has something in it.
	ui.draggable.css("background",""); // remove the old one. 	
    }
    listeners();
}

/* what happens when we drop the session onto the bucket list
   (thing named "unassigned events") */
function drop_bucket(event, ui){
    var temp_id = ui.draggable.attr('id'); // the django session id
    console.log("event "+event.id+" with ui.id "+temp_id);
    var slot_idd = $(this).attr('id');

    new_slot = slot_status[temp_id];
    var old_id = "old_id";

    if(new_slot) {
      old_id = json_to_id(new_slot);
    }

    var slot_status_obj = slot_status[old_id];

    slot_status[old_id].empty = true;
    var eTemplate = event_template( new_event.title, 
				    new_event.description,
				    new_event.session_id);
    var free = []
    $.each(slot_status, function(sskey) {
	ss = slot_status[sskey];
	var usable = true;
	if(ss.empty == true){
	    $.each(meeting_objs, function(mkey){
		if(meeting_objs.timeslot_id == ss.timeslot_id){
		    usable = false; 
		}
	    });
	    if(usable){
		new_event.timeslot_id = ss.timeslot_id;
	    }
	}
    });
    
    meeting_objs[temp_id] = new_event;
    $(this).append(eTemplate); // add the html code to the new slot.
    ui.draggable.remove(); // remove the old one. 
    
    Dajaxice.ietf.meeting.update_timeslot(dajaxice_callback,{'new_event':new_event}); /* dajaxice_callback does nothing */ 
    
    droppable(); // we need to run this again to toggle the new listeners
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
    if(check_free(this)){
	$(this).css("background","");
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


