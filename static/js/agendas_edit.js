
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
}

/*
 * Local Variables:
 * c-basic-offset:4
 * End:
 */

