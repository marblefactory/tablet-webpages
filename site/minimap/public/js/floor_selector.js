
/**
 * @param {Element} floor_list - a list which displays the names of the floors.
 */
function FloorSelector(floor_list, model) {
    this.floor_list = floor_list;
    this.model = model;

    // Called when a floor is selected. The index of the selected floor is
    // given to the callback.
    this.did_select_floor = function(floor_index) {};
}

FloorSelector.prototype = {
    /**
     * Sets the HTLM for the list of floors.
     */
    setup_floor_list: function() {
        this.floor_list.innerHTML = "";

        // Iterate backwards so the higher floors are at the top of the screen.
        // Let is used because of the scope problem with using var.
        for (let i=this.model.floor_names.length-1; i>=0; i--) {
            var list_item = document.createElement('li');
            var floor_button = document.createElement('button');
            var text = document.createTextNode(this.model.floor_names[i]);

            var _this = this;
            floor_button.addEventListener('click', e => _this.did_select_floor(i));
            floor_button.data_floor_index = i;

            floor_button.append(text);
            list_item.append(floor_button);
            this.floor_list.append(list_item);
        }

        this.update_selected_floor();
    },

    /**
     * Updates the CSS classes of the buttons to indicate the selected floor.
     */
    update_selected_floor: function() {
        var floor_select_buttons = this.floor_list.querySelectorAll('button');

        for (var i=0; i<floor_select_buttons.length; i++) {
            var button = floor_select_buttons[i];
            var selected_class = button.data_floor_index === this.model.view_floor_index() ? 'current_floor_select_button' : '';
            button.className = `floor_select_button ${selected_class}`;
        }
    }
};
