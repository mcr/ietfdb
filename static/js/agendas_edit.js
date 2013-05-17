
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


/////////////-END-GLOBALS-///////////////////////////////////////

/* refactor this out into the html */
$(document).ready(function() {
    init_agendas_edit();

    $("#CLOSE_IETF_MENUBAR").click();
});

/*
   init_timeslot_editf()
   This is ran at page load and sets up the entire page.
*/
function init_agendas_edit(){
    log("initstuff() ran");
    static_listeners();

    $(".agenda_visible").unbind('click');
    $(".agenda_visible").click(toggle_visible);
}

function toggle_visible(event) {
    var span_to_replace = $(event.target)
    var current_value   = $(event.target).attr('value');
    var agenda_url      = $(event.target).attr('href');

    var new_value = 1;
    if(current_value == "1") {
        new_value = "0"
    }
    event.preventDefault();

    $.ajax({ "url": agenda_url,
             "type": "PUT",
             "data": { "visible" : new_value },
             "success": function(result) {
             }});
}


/*
 * Local Variables:
 * c-basic-offset:4
 * End:
 */

