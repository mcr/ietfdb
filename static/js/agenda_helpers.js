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

/* hide_empty()
   looks for the rooms with no events in them and hides them.
   This is mostly a temp fix for hiding stuff. DOMs should just
   never be created. Allowing the toggle may be a nice feature though
*/
function hide_empty(){
    for(i=0;i<days.length;i++){
	var childs = ($("#"+days[i]+"tbody").children());
	for(k=0;k<childs.length;k++){
	    if($(childs[k]).find(".meeting_event").length == 0){
	    	$(childs[k]).toggle();
	    }
	}
    }

}

function print_all(){
    console.log("all");
    console.log(meeting_objs.length);
    for(var i=0; i<meeting_objs.length; i++){
	meeting_objs[i].print_out();
    }
}

/* this pushes every event into the calendars */
function load_events(){
    $.each(slot_status, function(key) {
	     log("loading event "+key)
	     ssid = slot_status[key];
	     session = meeting_objs[ssid.session_id];
	     populate_events(key, 
			     session.title,
			     session.description, 
			     session.session_id,
			     session.owner);
	});
}


function populate_events(js_room_id, title, description, session_id, owner){
    var eTemplate =     event_template(title, description, session_id);
    var t = title+" "+description;
    var good = insert_cell(js_room_id, eTemplate);
    if(good < 1){
	event_template(title, description,time).appendTo("#sortable-list");
    }
}

function event_template(event_title, description, session_id){
    var part1 = "";
    var part2 = "";
    var part3 = "";
    var part2 = "<table class='meeting_event' id='"+session_id+"'><tr id='meeting_event_title'><th>"+event_title+"</th></tr>";
    // var part2 = "<table class='meeting_event' id='"+session_id+"'><tr id='meeting_event_title'><th>"+event_title+"</th></tr><tr><td> .."+description+" ..</td></tr></table>"
    // var part2 = "<table class='meeting_event' id='"+session_id+"'><tr id='meeting_event_title'><th>"+event_title+"</th></tr><tr><td style='height:10px'> .."+description+" ..</td></tr></table>"
    return $(part1+part2+part3);
}

function check_free(inp){
    var empty = false;
    try{
	empty = slot_status[inp.id].empty;
    }
    catch(err){
	empty = false;
	console.log(err);
    }
    return empty;
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
    $("#info_location_select").val(inp.ss_id);
    $("#info_location_select_option_"+inp.ss_id).css('background-color',highlight);

    listeners();
    
    $("#info_responsible").html(inp.responsible_ad);
    $("#info_requestedby").html(inp.requested_by +" ("+inp.requested_time+")");
    
    
    
}

function generate_select_box(){
    var html = "<select id='info_location_select'>";
    $.each(meeting_objs, function(K,V){
	/* K is the meeting_objs key */
	/* V is the meeting_event */
	html=html+"<option value='"+K+"' id='info_location_select_option_"+V.session_id+"'>"+V.short_string()+"</option>";
	
    });
    html = html+"</select>";
    return html;

}


function insert_cell(js_room_id, text){
    slot_id = ("#"+js_room_id);
    log("Adding "+slot_id+" with "+text)
    try{
	var found = $(slot_id).append(text);
	$(slot_id).css('background','');
	if(found.length == 0){
	    // do something here....
	}
    }
    catch(err){
	log("error");
	log(err);
    } 
}
