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

/* this pushes every event into the calendars */
function load_events(){
    $.each(slot_status, function(key) {
	     //log("loading event "+key)
	     ssid = slot_status[key];
	     slot_id = ("#"+ssid.domid);
	     $(slot_id).css('background-color', '#006699');
	     session = meeting_objs[ssid.session_id];
	     if (session != null) {
	       session.placed = true;
	       populate_events(key, 
			       session.title,
			       session.description, 
			       session.session_id,
			       session.owner);
	       //log("setting "+slot_id+" as used");
	       //$(slot_id).css('background', '#553300');
	     } else {
	       log("ssid: "+key+" is null");
	     }
	});

    /*
    $.each(meeting_objs, function(key) {
	     session = meeting_objs[key];
	     if(!session.placed) {
	       event_template(session.title, session.description, session.session_id).appendTo("#sortable-list");
	     }
	   });
    */
}


function populate_events(js_room_id, title, description, session_id, owner){
    var eTemplate =     event_template(title, description, session_id);
    var t = title+" "+description;
    insert_cell(js_room_id, eTemplate, true);
}

function event_template(event_title, description, session_id){
    var part1 = "";
    var part2 = "";
    var part3 = "";
    var part2 = "<table class='meeting_event' id='session_"+session_id+"'><tr id='meeting_event_title'><th>"+event_title+"</th></tr>";
    // var part2 = "<table class='meeting_event' id='"+session_id+"'><tr id='meeting_event_title'><th>"+event_title+"</th></tr><tr><td> .."+description+" ..</td></tr></table>"
    // var part2 = "<table class='meeting_event' id='"+session_id+"'><tr id='meeting_event_title'><th>"+event_title+"</th></tr><tr><td style='height:10px'> .."+description+" ..</td></tr></table>"
    return $(part1+part2+part3);
}

function check_free(inp){
    var empty = false;
    slot = slot_status[inp.id];
    empty = false;
    if(slot) {
      empty = slot.empty;
    }
    console.log("inp.id "+inp.id + " returns "+empty + "slot: "+slot);
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
      var v1 = slot_status[k1];
      console.log("k1: "+k1+" v1: "+v1);
      /* k1 is the slot_status key */
      /* v1 is the slot_obj */
      html=html+"<option value='"+k1;
      html=html+"' id='info_location_select_option_";
      html=html+v1.timeslot_id+"'>";
      html=html+v1.short_string;
      html=html+"</option>";
    }
    html = html+"</select>";
    room_select_html = html;
}

function generate_select_box(){
    return room_select_html;
}


function insert_cell(js_room_id, text, replace){
    slot_id = ("#"+js_room_id);
    //log("Adding "+slot_id+" with "+text)
    try{
      var found;
      if(replace) {
	found = $(slot_id).html(text);
      } else {
	found = $(slot_id).append(text);
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
