/*
*   agenda_properties_edit.js
*
*   Orlando Project: Credil 2013 ( http://credil.org/ )
*   Author: Justin Hornosty    <justin@credil.org>
*   Author: Michael Richardson <mcr@sandelman.ca>
*
*
*   This file should contain functions relating to
*   editing a single agenda.
*
*/




//////////////-GLOBALS----////////////////////////////////////////


/////////////-END-GLOBALS-///////////////////////////////////////
var cancel_url;

$(document).ready(function() {
    init_agenda_edit();

    cancel_url = $("#agenda_cancel_url").attr("href");

    /* hide the side bar by default. */
    $("#CLOSE_IETF_MENUBAR").click();
});

function init_agenda_edit(){
    log("initstuff() ran");
    static_listeners();

    $(".agenda_delete").unbind('click');
    $(".agenda_delete").click(delete_agenda);

    $("#agenda_save").unbind('click');
    $("#agenda_save").click(save_agenda);

    $(".agenda_official_mark").unbind('click');
    $(".agenda_official_mark").click(toggle_official);


}

function toggle_public(event) {
    var span_to_replace = event.target;
    var current_value   = $(event.target).html();
    var agenda_url      = $(event.target).closest('tr').attr('href');

    var new_value = 1;
    log("value "+current_value)
    if(current_value == "public") {
        new_value = 0
    }
    event.preventDefault();

    $.ajax({ "url": agenda_url,
             "type": "PUT",
             "data": { "public" : new_value },
             "dataType": "json",
             "success": function(result) {
                 /* result is a json object */
                 value = result["public"]
                 log("new value "+value)
                 $(span_to_replace).html(value)
             }});
}

function toggle_visible(event) {
    var span_to_replace = event.target;
    var current_value   = $(event.target).html();
    var agenda_url      = $(event.target).closest('tr').attr('href');

    var new_value = 1;
    log("value "+current_value)
    if(current_value == "visible") {
        new_value = 0
    }
    event.preventDefault();

    $.ajax({ "url": agenda_url,
             "type": "PUT",
             "data": { "visible" : new_value },
             "dataType": "json",
             "success": function(result) {
                 /* result is a json object */
                 value = result["visible"]
                 log("new value "+value)
                 $(span_to_replace).html(value)
             }});
}

function toggle_official(event) {
    var agenda_name   = $(event.target).closest('tr').attr('agenda_name');
    var agenda_id     = $(event.target).closest('tr').attr('id');
    var meeting_url   = $(".agenda_list_title").attr('href');
    event.preventDefault();

    /*
     * if any of them are clicked, then go through all of them
     * and set them to "unofficial", then based upon the return
     * we might this one to official.
     */

    var value = 0;
    if($(event.target).html() == "official") {
        value = 1;
    }
    var new_value = agenda_name;
    var new_official = 1;
    if(value > 0) {
        new_value    = "None";
        new_official = 0;
    }

    var rows = $(".agenda_list tr:gt(0)");
    rows.each(function(index) {
                  log("row: "+this);
		  /* this is now the tr */
		  $(this).removeClass("agenda_official_row");
		  $(this).addClass("agenda_unofficial_row");

		  /* not DRY, this occurs deep in the model too */
		  $(this).find(".agenda_official_mark").html("unofficial");
	      });

    //log("clicked on "+agenda_url+" sending to "+meeting_url);

    $.ajax({ "url": meeting_url,
             "type": "PUT",
             "data": { "agenda" : new_value },
             "dataType": "json",
             "success": function(result) {
                   /* result is a json object */
                   if(new_official) {
                       $("#"+agenda_id).find(".agenda_official_mark").html("official");
                       $("#"+agenda_id).addClass("agenda_official_row");
                   }}});
}

function save_agenda(form) {

    var agenda_url  = form.action;
    var name_str    = form.elements["name"].value;
    var public_flag = false;
    var visible_flag= false;

    public_flag = form.elements["public"].checked   ? true : false;
    visible_flag = form.elements["visible"].checked ? true: false;
    console.log("PUT to ",agenda_url," with name:", name_str,
                "visible:", visible_flag,
                "public:",  public_flag);

    $.ajax({"url": agenda_url,
            "type": "PUT",
            "data": {  "public" : public_flag,
                       "visible": visible_flag,
                       "name"   : name_str,
                       },
             "dataType": "json",
             "success": function(result) {
                   window.location.assign(cancel_url);
             }});

}


/*
 * Local Variables:
 * c-basic-offset:4
 * End:
 */

