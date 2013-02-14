/*
*   agenda_helpers.js
*
*   Orlando Project: Credil 2013 ( http://credil.org/ )
*   Author: Justin Hornosty ( justin@credil.org )
* 
*   Should contain miscellaneous commonly used functions.
*   
*   
*/

/* logging helper function */
function log(text){
    console.log(text);
}


function print_all(){
    console.log("all");
    console.log(meeting_objs.length);
    for(var i=0; i<meeting_objs.length; i++){
		meeting_objs[i].print_out();
    }
}

function find_title(title){
    $.each(meeting_objs, function(key){
	if (meeting_objs[key].title == title) {
	    console.log(meeting_objs[key]);
	}
    });
}
function find_session_id(session_id){
    $.each(meeting_objs, function(key){
	if (meeting_objs[key].session_id == session_id) {
	    console.log(meeting_objs[key]);
	}
    });
}


/* this pushes every event into the calendars */
function load_events(){
    /* first delete all html items */
    $.each(slot_status, function(key) {
        ssid = slot_status[key];
        insert_cell(ssid.domid, "", true);
    });
    
    $.each(slot_status, function(key) {
//        log("loading event "+key)
        ssid_arr = slot_status[key]
	
	for(var q = 0; q<ssid_arr.length; q++){
	    ssid = ssid_arr[q];
            slot_id = ("#"+ssid.domid);
            $(slot_id).css('background-color',color_droppable_empty_slot ); //'#006699'
            session = meeting_objs[ssid.session_id];
            if (session != null) {
	       	session.slot_status_key = key;
                session.placed = true;
                populate_events(key,
                                session.title,
                                session.description, 
                                session.session_id,
                                session.owner);
		//log("setting "+slot_id+" as used");

            } else {
		//log("ssid: "+key+" is null");
		   
            }
	}
    });
    
}


function populate_events(js_room_id, title, description, session_id, owner){
    var eTemplate =     event_template(title, description, session_id);
    var t = title+" "+description;
    insert_cell(js_room_id, eTemplate, false);
}

function event_template(event_title, description, session_id){
    return "<table class='meeting_event' id='session_"+session_id+"'><tr id='meeting_event_title'><th>"+event_title+"</th></tr>";
}

function check_free(inp){
    var empty = false;
    slot = slot_status[inp.id];
	console.log(slot);
    if(slot) {
        empty = slot.empty;
    }
//    console.log("inp.id "+inp.id + " returns "+empty + "slot: "+slot);
	if(empty == false || empty == "False"){ // sometimes empty will be the string "False" instead of a boolean. 
		return false;
	}
	else{
		return true;
	}
}



function json_to_id(j){
    return (j.room+"_"+j.date+"_"+j.time);
}

function id_to_json(id){
    if(id != null){
	var split = id.split('_');
	return {"room":split[0],"date":split[1],"time":split[2]}
    }
    else{
	return null;
    }
}


/* returns a the html for a row in a table 
   as: <tr><td>title</td><td>data</td></tr>
*/
function gen_tr_td(title,data){
    return "<tr><td>"+title+"</td><td>"+data+"</td></tr>";
}

/* Mainly for the case where we didn't get any data back from the server */ 
function empty_info_table(){
    $("#info_grp").html("");
    $("#info_name").html("");
    $("#info_area").html("");
    $("#info_duration").html("");
    $("#info_location").html(generate_select_box()+"<button id='info_location_swap'>Swap</button>");
    $("#info_location_select").val("");
    $("#info_location_select").val($("#info_location_select_option_"+current_timeslot).val());
    $("#info_responsible").html("");
    $("#info_requestedby").html("");

    // $("#info_location_select_option_"+inp.ss_id).css('background-color',highlight);

//    listeners();
    




}

/* creates the 'info' table that is located on the right side. 
   takes in a json. 
*/
function generate_info_table(inp){
    $("#info_grp").html(inp.group);
    $("#info_name").html(inp.name);
    $("#info_area").html(inp.area);
    $("#info_duration").html(inp.ts_duration);
    //$("#info_location").html(inp.ts_day_of_week+", "+inp.ts_time_hour+", "+inp.room);
//    $("#info_location").html(inp.ts_day_of_week+", "+inp.ts_time_hour+", "+inp.room + "," +generate_select_box());

    $("#info_location").html(generate_select_box()+"<button id='info_location_swap'>Swap</button>");

    $("#info_location_select").val(inp.timeslot_id);
    console.log("git "+"#info_location_select_option_"+inp.timeslot_id);
    $("#info_location_select").val($("#info_location_select_option_"+inp.timeslot_id).val());

    $("#"+inp.timeslot_id).css('background-color',highlight);

    listeners();
    
    $("#info_responsible").html(inp.responsible_ad);
    $("#info_requestedby").html(inp.requested_by +" ("+inp.requested_time+")");
}


var room_select_html = "";
function calculate_room_select_box() {
    var html = "<select id='info_location_select'>";

    var keys = Object.keys(slot_status)
    var sorted = keys.sort(function(a,b) {
			     a1=slot_status[a];
			     b1=slot_status[b];
			     if (a1.date != b1.date) {
			       return a1.date-b1.date;
			     }
			     return a1.time - b1.time;
			   });

    for (n in sorted) {
        var k1 = sorted[n];
        var val_arr = slot_status[k1];
		
        /* k1 is the slot_status key */
        /* v1 is the slot_obj */
	for(var i = 0; i<val_arr.length; i++){
	    var v1 = val_arr[i];
            html=html+"<option value='"+k1;
            html=html+"' id='info_location_select_option_";
            html=html+v1.timeslot_id+"'>";
            html=html+v1.short_string;
            html=html+"</option>";
	}
    }
    html = html+"</select>";
    room_select_html = html;
    
}

function generate_select_box(){
    return room_select_html;
}


function insert_cell(js_room_id, text, replace){
    slot_id = ("#"+js_room_id);
    //console.log(slot_id);
    //log("Adding "+slot_id+" with "+text+" to "+ $(slot_id).attr('id'))
    try{
	var found;
        if(replace) {
	    found = $(slot_id).html(text);
        } else {
            found = $(slot_id).append($(text));
	    
        }
        $(slot_id).css('background','');
        if(found.length == 0){
            // do something here, if length was zero... then?
        }
	
    }
    catch(err){
	log("error");
	log(err);
    } 
}

/*
 * Local Variables:
 * c-basic-offset:4
 * End:
 */
