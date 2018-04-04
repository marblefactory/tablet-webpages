
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
        // Another function is required because of the scope of variable i.
        function add_click_listener(button, floor_index) {
            var _this = this;
            floor_button.addEventListener('click', e => _this.did_select_floor(floor_index));
        }

        for (var i=0; i<this.model.floor_names.length; i++) {
            var list_item = document.createElement('li');
            var floor_button = document.createElement('button');
            var text = document.createTextNode(this.model.floor_names[i]);

            add_click_listener.bind(this)(floor_button, i);

            floor_button.append(text);
            list_item.append(floor_button);
            this.floor_list.append(list_item);
        }
    }
};
