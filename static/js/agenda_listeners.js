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


// console = { 
//     log: function(inp){
	
//     } 
// };


/* this function needs to be renamed... it should only deal with listeners who need to be unbound prior to rebinding. */
function listeners(){
    $('.meeting_event').unbind('click'); // If we don't unbind it, things end up getting stacked, and tons of ajax things are sent. 
    $('.meeting_event').click(meeting_event_click);

    $('#info_location_select').unbind('change');
    $('#info_location_select').change(info_location_select_change);

    $('#info_name_select').unbind('change');
    $('#info_name_select').change(info_name_select_change);
    
//    $('span.APP-scheme').click(function(event){ console.log("click") });
    $('.color_checkboxes').unbind('click');
    $('.color_checkboxes').click(color_legend_click);

}


/* the functionality of these listeners will never change so they do not need to be run twice  */
function static_listeners(){
    $('#CLOSE_IETF_MENUBAR').click(hide_ietf_menu_bar);
}


function color_legend_click(event){
    var clicked = $(event.toElement).attr('id');
    if(legend_status[clicked]){
	legend_status[clicked] = false;
    }
    else{
	legend_status[clicked] = true;
    }
    set_transparent();
    
}

function set_transparent(){
    $.each(meeting_objs, function(key){
	$.each(legend_status, function(k){
	    if(meeting_objs[key].area == k){
		if(legend_status[k] == true){
		    $("#session_"+key).css('opacity','1');
		    $("#session_"+key).draggable("option","cancel",null);
		}
		else{
		    $("#session_"+key).css('opacity','0.1');
		    $("#session_"+key).draggable("option","cancel",".meeting_event");
		}
	    }})
	    
    });
}


var clicked_event;

var current_item = null;
var current_timeslot = null;
function meeting_event_click(event){
    console.log("Meeting_event_click");
    try{
	clear_highlight(find_friends(current_item));
    }catch(err){ }
    
    $(last_item).css("background-color", '');
    
    var slot_id = $(event.target).closest('.agenda_slot').attr('id');
    var meeting_event_id = $(this).attr('id');
   
    clicked_event = event;

    slot = slot_status[slot_id];
    meeting_event_id = meeting_event_id.substring(8,meeting_event_id.length);
    if(slot == null){ // not in a real slot...
	var slot_obj = {   slot_id: meeting_event_id ,
            scheduledsession_id:meeting_event_id,
            timeslot_id: null,
            session_id: meeting_event_id,
         }
        
	dajaxice_fill_in_info(slot_obj,slot_id);
	return
    }
	

    for(var i = 0; i<slot.length; i++){
	session_id = slot[i].session_id;
	if(session_id == meeting_event_id){
	    $("#session_"+session_id).css('background-color',highlight);
	    current_item = "#session_"+session_id;
	    
	    current_timeslot = slot[i].timeslot_id;
	    empty_info_table();
	    dajaxice_fill_in_info(slot[i],slot_id);
	}
    }
    
}

var last_item = null; // used during location change. we make the background color
// of the timeslot highlight because it is being set into that slot.
function info_location_select_change(){
    console.log("last_item...");
    if(last_item != null){
	console.log(last_item);
	$(last_item).css('background-color','');
    }
    last_item = '#'+$('#info_location_select').val();
    console.log("last_item...");    
    //$('#'+$('#info_location_select').val()).css('background-color',highlight);
    $(last_item).css('background-color',highlight);
}

var last_name_item = null;
function info_name_select_change(){
    console.log(last_item);
    $(last_item).css("background-color", '');
    $(current_item).css('background-color','');
    if(last_name_item != null){
	console.log(last_name_item);
	$(last_name_item).css('background-color','');
	
    }
    if(current_item != null){
	$(current_item).css('background-color','');
	
    }
    last_name_item = '#'+$('#info_name_select').val();
    var slot_id = last_name_item.substring(1,last_name_item.length);
    var slot_status_obj = slot_status[slot_id];
    current_item = "#session_"+slot_status_obj[0].session_id;
    current_timeslot = slot_status_obj[0].timeslot_id;
    dajaxice_fill_in_info(slot_status_obj[0],slot_id);
    $(current_item).css('background-color',highlight);
//    $('#'+$('#info_name_select').val()).css('background-color',highlight);
}


function dajaxice_fill_in_info(slot, slot_id){
    console.log("slot_id:",slot_id);
    console.log("slot.scheduledsession_id:",slot.scheduledsession_id);
    console.log("timeslot_id:", slot.timeslot_id);
    console.log("session_id:", slot.session_id);
    console.log(slot);
    Dajaxice.ietf.meeting.get_info(fill_in_info,
                                   {   "active_slot_id": slot_id,
                                       "scheduledsession_id": slot.scheduledsession_id,
                                       "timeslot_id": slot.timeslot_id,
                                       "session_id": slot.session_id
                                   },
                                   dajaxice_error );
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



/* create the droppable */
function droppable(){
    console.log("droppable called");
    $(function() {
	/* the thing that is draggable */
	$( ".meeting_event").draggable({
	    appendTo: "body",
	    helper: "clone",
	    drag: drag_drag,
	    start: drag_start,
	});

	$( "#sortable-list").droppable({
	    over : drop_over,
	    activate: drop_activate,
	    out : drop_out,
	    drop : drop_drop,
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


var arr_key_index = null;
function update_to_slot(meeting_id, to_slot_id, force){
    console.log("\t----update_to_slot----");
    
    var to_slot = slot_status[to_slot_id];
//    console.log(to_slot, to_slot.length);
    var found = false;
    for(var i=0; i<to_slot.length; i++){
	if(to_slot[i].empty == "True" || to_slot[i].empty == true){ // we found a empty place to put it.
	    // setup slot_status info.
	    to_slot[i].session_id = meeting_id;
	    console.log(meeting_id);
	    to_slot[i].empty = false;

	    // update meeting_obj
	    //meeting_objs[meeting_id].slot_status_key = to_slot[i].domid
	    arr_key_index = i;
	    meeting_objs[meeting_id].placed = true;
	    found = true;
	    // update from_slot
//	    console.log("work is done, breaking");
	    return found;
	}
    }
    console.log("\tsomething was not found...");
    if(!found && force){
	to_slot.push(new slot_obj(to_slot[0].scheduledsession_id, to_slot[0].empty, to_slot[0].timeslot_id,meeting_id,to_slot[0].room, to_slot[0].time,to_slot[0].date,to_slot[0].domid));
	found = true;
	return found;
    }
    return found;
}


function update_from_slot(meeting_id, from_slot_id){
    console.log("\t----update_from_slot-----");
    var from_slot = slot_status[meeting_objs[meeting_id].slot_status_key]; // remember this is an array...
    var found = false;
//    console.log(from_slot_id, from_slot, from_slot.length);
    if(from_slot_id != null){ // it will be null if it's coming from a bucketlist
	for(var k = 0; k<from_slot.length; k++){
	    if(from_slot[k].session_id == meeting_id){
		found = true;
		from_slot[k].empty = true;
		from_slot[k].session_id = null;
		return found;
	    }
	}
    }
    else{
	found = true; // this may be questionable. It deals with the fact that it's coming from a bucketlist. 
	return found;
    }
    return found;
}


/* move_slot 
   @args: meeting_id - id of the thing we are moving
          from_slot_id - id of the slot it's moving from
	  to_slot_id - id of the slot it's moving to
	  force - if there isn't a free slot here, should we 'force' it in?
	          This should happen with the bucket list as it should continously grow.
 */
function move_slot(meeting_id,from_slot_id,to_slot_id,force){
    
    

}


function drop_drop(event, ui){
    console.log("------ drop drop --------");
    var meeting_id = ui.draggable.attr('id'); // the meeting id. 
    meeting_id = meeting_id.substring(8,meeting_id.length); // it has session_ infront of it. so make it this. 
    
    var to_slot_id = $(this).attr('id'); // where we are dragging it. 
    var to_slot = slot_status[to_slot_id]

    var from_slot_id = meeting_objs[meeting_id].slot_status_key;
    var from_slot = slot_status[meeting_objs[meeting_id].slot_status_key]; // remember this is an array...

    bucket_list = (to_slot_id == "sortable-list");
    if(!check_free({id:to_slot_id}) ){
	console.log("not free...");
	if(!bucket_list){
	    return
	}
    }
//    console.log("to_slot_id",to_slot_id, slot_status[to_slot_id]);
//    console.log("from_slot_id",from_slot_id, slot_status[from_slot_id]);
    var update_to_slot_worked = false;
    
    if(bucket_list){
	update_to_slot_worked = update_to_slot(meeting_id, to_slot_id, true);
    }
    else{
	update_to_slot_worked = update_to_slot(meeting_id, to_slot_id);
    }
    
    if(update_to_slot_worked){
	if(update_from_slot(meeting_id, from_slot_id)){
	    // do something
	}
	else{
	    console.log("issue updateing from_slot");
	    console.log("from_slot_id",from_slot_id, slot_status[from_slot_id]);
	    return;
	}
    }
    else{
	console.log("issue updateing to_slot");
	console.log("to_slot_id",to_slot_id, slot_status[to_slot_id]);
	return;
    }
    meeting_objs[meeting_id].slot_status_key = to_slot[arr_key_index].domid
    //*****  do dajaxice call here  ****** //

    var eTemplate = event_template(meeting_objs[meeting_id].title, meeting_objs[meeting_id].description, meeting_objs[meeting_id].session_id,meeting_objs[meeting_id].area);
    $(this).append(eTemplate)
    
    ui.draggable.remove();



    /* set colors */
    if(check_free({id:to_slot_id}) ){
	$(this).css('background-color', color_droppable_empty_slot)
    }
    else{
	$(this).css('background-color',none_color);
    }
    
    if(check_free({id:from_slot_id}) ){
	$("#"+from_slot_id).css('background-color', color_droppable_empty_slot)
    }
    else{
	$("#"+from_slot_id).css('background-color',none_color);
    }
    $("#"+"sortable-list").css('background-color',none_color);
    /******************************************************/
   
    var schedulesession_id = null;
    for(var i =0; i< to_slot.length; i++){
	if (to_slot[i].session_id == meeting_id){
	    schedulesession_id = to_slot[i].scheduledsession_id;
	    break;
	}
    }
    if(schedulesession_id != null){
	Dajaxice.ietf.meeting.update_timeslot(dajaxice_callback,
                                              {
						  'session_id':meeting_objs[meeting_id].session_id,
						  'scheduledsession_id': schedulesession_id,
                                              });
	
    }
    else{
	console.log("issue sending ajax call!!!");
    }
    droppable();
    listeners();
    console.log("moving complete.");
}

/* what happens when we drop the session onto the bucket list
   (thing named "unassigned events") */
function drop_bucket(event,ui){
    console.log("------ drop bucket --------");

    var meeting_id = ui.draggable.attr('id');
    meeting_id = meeting_id.substring(8,meeting_id.length); // it has session_ infront of it. so make it this. 

    var to_slot_id = $(this).attr('id'); // where we are dragging it.
    var from_slot_id = meeting_objs[meeting_id].slot_status_key;
    
    if(to_slot_id == "sortable-list"){ // it's being moved to the bucketlist so update where it's coming from.
	console.log("sortable-list dest");
	if (!update_from_slot(meeting_id, from_slot_id)){
	    console.log(slot_status[from_slot_id]);
	    console.log("issue updating from_slot");
	    return;
	}
    }
    else{ // moving from bucket list to a slot, so update it's dest.
	console.log("moving from bucket_list");
	if (!update_to_slot(meeting_id, to_slot_id)){
	    console.log("issue updating to_slot");
	    return;
	}
	meeting_objs[meeting_id].slot_status_key = to_slot[arr_key_index].domid

    }

    
    //*****  do dajaxice call here  ****** //

    var eTemplate = event_template(meeting_objs[meeting_id].title, meeting_objs[meeting_id].description, meeting_objs[meeting_id].session_id);
    $(this).append(eTemplate)
    
    ui.draggable.remove();
    
    droppable();
    listeners();
    console.log("moving complete.");
}



function drop_bucket2(event,ui){
    console.log("drop_bucket called");
    var temp_session_id = ui.draggable.attr('id'); // the django session id
    var idd = temp_session_id.substring(8,temp_session_id.length);
    var session_obj =  meeting_objs[idd];
    
    slot_status[session_obj.slot_status_key].session_id = null;
    slot_status[session_obj.slot_status_key][0].empty = true;
    $("#"+session_obj.slot_status_key).css('background',color_droppable_empty_slot);
    session_obj.placed = false;
    session_obj.slot_status_key = null;
    
    var eTemplate = event_template(session_obj.title, session_obj.description,
                                   session_obj.session_id, session_obj.area);
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
    if(check_free(this)){
	$(this).css("background",color_droppable_empty_slot);
    }
}


/* functions here are not used at the moment */
function drop_create(event,ui){
}

function drop_start(event,ui){
}

function drag_drag(event, ui){
    

    
}
function drag_start(event, ui){
    console.log(ui);
    return;
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
