import {View} from './view'
import {fillInView, save} from './functions'
import {isMobile} from './helperFunctions'
import {toggleMenu} from './calHtml'

/**
 * Calender Events
 * @param {string} time time of the event
 * @param {string} title title of the event
 * @param {string} notes notes of the event
 * @param {string} tdid the id of the td that the event belongs to, should be in the form of day-month-year
 */
export function Event(time = "(No Time)", title = "(No Title)", notes = "(No Notes)", tdid = null) {
    this.time = time;
    this.title = title;
    this.notes = notes;
    this.tdID = tdid;
    this.id = `calEvent_${this.tdID}_#${++eventCnt}`;

    if (this.tdID === null) {
        throw new error("Error: event tdID cannot be null");
    }

    if (this.time === '' && this.title === '') {
        throw new error("Error: cannot create blank event");
    }

    this.toElement = () => {
        let e = View.elt("div", {
            class: 'calEvent',
            id: this.id
        }, View.elt("span", {
            class: 'calEventTime'
        }, this.time), View.elt("span", {
            class: 'calEventTitle'
        }, this.title));

        //click event for event
        e.addEventListener("click", event => {
            selectedEvent = e;
            if(!isMobile()){
                fillInView();
               toggleMenu(Menus.viewEvent);
            }
        });
        return e;
    }
}

/**
 * Calender Sticker
 * @param {string} type type should correspond to a mapping
 * @param {object} transform transform object
 */
function Sticker(type, transform) {
    if (stickerMap.has(type))
        this.type = type;
    else
        console.error("Sticker type does not exsist");

    this.transform = transform;
}

/**
 * Transformations applied to a sticker
 * @param {number} scale
 * @param {number} rotate
 */
function Transform(scale = 0, rotate = 0) {
    this.scale = scale;
    this.rotate = rotate;
}

/**
 * Stores menus
 * {id, header, content, footer, buttons}
 * note: if button placement is in form, should include parent id
 */
export const Menus = {
    addEvent: {
        id: "addEvent",
        header: {
            title: "Add Event to Calender"
        },
        content:
            View.eltObj("form", {id: "addEventForm", name: "addEventForm"}, {listeners: ["submit", addEventFormSubmit]},
                View.eltObj("input", {type: "time", name: "time", id: "addEventTime"}, {}),
                View.eltObj("label", {for: "addEventTime"}, {}, "Time:"),
                View.eltObj("input", {name: "title", id: "addEventTitle"}, {}),
                View.eltObj("label", {for: "addEventTitle"}, {}, "Title:"),
                View.eltObj("textarea", {name: "notes", id: "addEventNotes", pattern: ".{0}"}, {}),
                View.eltObj("label", {for: "addEventNotes"}, {}, "Notes:")),
        buttons: [
            View.eltObj("button", {id: "addEventSubmit", type: "submit"}, {placement: "form", parentId: "addEventForm"}, "save")
        ]
    },

    editEvent: {
        id: "editEvent",
        header: {
            title: "Edit Event"
        },
        content:
         View.eltObj("form", {id: "editEventForm"}, {},
                View.eltObj("input", {type: "time", name: "time", id: "editEventTime"}, {}),
                View.eltObj("label", {for: "editEventTime"}, {}, "Time:"),
                View.eltObj("input", {name: "title", id: "editEventTitle"}, {}),
                View.eltObj("label", {for: "editEventTitle"}, {}, "Title:"),
                View.eltObj("textarea", {name: "notes", id: "editEventNotes", pattern: ".{0}"}, {}),
                View.eltObj("label", {for: "editEventNotes"}, {}, "Notes:")),
        buttons: [
            View.eltObj("button", {id: "editEventSubmit", type: "submit"}, {placement: "form", parentId: "editEventForm",
                                                                            listeners: ["click", editFormSubmit]}, "save")
        ]
    },

    viewEvent:{
        id: "viewEvent",
        content:
        [
        View.eltObj("h3", {id: "viewTitle", class: "stitched"}, "(No Title)"),
        View.eltObj("br"),
        View.eltObj("p",  {id: "viewTime"}, "(No Time)"),
        View.eltObj("br"),
        View.eltObj("p",  {id: "viewNotes"}, "(No Notes)")
        ],
        buttons: [
            View.eltObj("button", {id: "viewEdit"}, {placement: "content", listeners: ["click", showMenu, 'editEvent']}, "Edit Event"),
            View.eltObj("button", {id: "viewDelete"}, {placement: "content", listeners: ["click", deleteEvent]}, "Delete Event")
        ]
    },

    mobile: {
        id: "mobile",
        content: [
            View.eltObj("span", {}, {}, "Events")
        ],
        buttons: [
            View.eltObj("button", {id: "mobileAddEvent"}, {placement: "footer", listeners: ["click", showMenu, 'addEvent']}, "New Event")
        ]
    },

    contentGenerators: {
        viewEvent:
        /**
         * Fills in viewEvents content
         * @param {Event} event event to view
         */
         (event) => {
            let title = event.title ? event.title : "(No Title)";
            let time  = event.time  ? event.time  : "(No Time)";
            let notes = event.notes ? event.notes : "(No Notes)";
            Menus.viewEvent.content =
            [
            View.eltObj("h3", {id: "viewTitle", class: "stitched"}, {}, title),
            View.eltObj("br"),
            View.eltObj("p",  {id: "viewTime"}, {}, time),
            View.eltObj("br"),
            View.eltObj("p",  {id: "viewNotes"}, {}, notes)
            ]
        }
    }
}

//////////////////////////////////////////////
/////|EVENT LISTENERS|///////////////////////
////////////////////////////////////////////

/**
 * Shows menu from given string
 * @param  {string} menu the menu to show
 */
function showMenu(menu){
    let menuToShow = null;
    switch(menu){
        case 'editEvent': menuToShow = Menus.editEvent; break;
        case 'addEvent' : menuToShow = Menus.addEvent;  break;
        case 'viewEvent': menuToShow = Menus.viewEvent; break;
        case 'mobile'   : menuToShow = Menus.mobile;    break;
        default: console.error('Menu could not be shown. Menu:', menu, 'could not be found.');
    }
    toggleMenu(menuToShow);
}


function addEventFormSubmit(event) {
    let addEventForm = document.querySelector("#addEventForm");
    let time  = addEventForm.elements.time.value;
    let title = addEventForm.elements.title.value;
    let notes = addEventForm.elements.notes.value;

    try {
        let ev = new Event(time, title, notes, selectedDateTD.id);
        let evElem = ev.toElement();

        events.push(ev);
        selectedDateTD.getElementsByClassName("eventContainer")[0].appendChild(evElem);
        selectedEvent = evElem;
        fillInView();
        save(); //save the new event
    } catch (err) {
        let extraMsg = '';
        console.error(err.name, ":", err.message); //log error
        //Do not create event if error
        if(!((time === "" || time === undefined ) && (time === "" || time === undefined)))
            extraMsg = 'Event must have time or title.'
        alert(`Event could not be created. ${extraMsg}`);
    } finally {
        View.toggleClass(addEventForm.parentElement.parentElement.parentElement, 'hidden', false);
        addEventForm.reset();
        //event.preventDefault();
    }
}

function editFormSubmit(event) {
    let editForm = document.querySelector("#editEventForm");
    let time = editForm.elements.time.value;
    let title = editForm.elements.title.value;
    let notes = editForm.elements.notes.value;

    //find stored event to update its data
    events.some(function (e) {
        if (e.id == selectedEvent.id) {
            if (time) e.time = time;
            if (title) e.title = title;
            if (notes) e.notes = notes;
            save();
            return true;
        }
    });

    if (time) selectedEvent.getElementsByClassName("calEventTime")[0].textContent = time;
    if (title) selectedEvent.getElementsByClassName("calEventTitle")[0].textContent = title;

    View.toggleClass(editForm.parentElement.parentElement.parentElement, 'hidden', false);
    editForm.reset();

    fillInView();
    toggleMenu(Menus.viewEvent);
    event.preventDefault();
}

function deleteEvent(event = null, eventElt){
    let userConfirm = confirm("This will permanently delete the event. Do you wish to continue?");
    if (userConfirm) {
        //If event is either not provided or is not an object, search for a matching event
        if(!event || !eventElt || event.constructor !== Object ){
            events.some((e) => {
                if (e.id == selectedEvent.id) {
                    event = e;
                    eventElt = selectedEvent;
                    return true;
                }
            });
        }
        // Remove event from events list
        if(event !== null && events.indexOf(event)){
            events.splice(events.indexOf(event), 1);
            save();
        }
        else{
            console.warn("Warning: event was not deleted. Event could not be found");
        }

        // Remove div
        eventElt.parentElement.removeChild(eventElt);
        View.toggleClass(".menu.wrapper", 'hidden', true);
    }
}