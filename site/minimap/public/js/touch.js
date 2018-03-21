
/**
 * Adds touch and click events to the supplied DOM element.
 */
function add_press_event_listener(element, callback) {
    element.addEventListener('click', callback, false);
    element.addEventListener('touch', callback, false);
}
