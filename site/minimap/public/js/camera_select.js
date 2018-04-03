
/**
 * @param {[string]} camera_feed_colors - the colors associated with each of the 4 feeds.
 */
function CameraSelectorView(camera_feed_colors) {
    this._background = document.querySelector("#camera_select_background");
    this._camera_feed_colors = camera_feed_colors;
    this._setup_background();
    this._setup_foreground();

    // Called when a camera feed is pressed. The index of the feed is supplied.
    this.on_feed_pressed = function(index) {};
}

CameraSelectorView.prototype = {
    _setup_background: function() {
        add_press_event_listener(this._background, this.hide.bind(this));
    },

    _setup_foreground: function() {
        var foreground = document.querySelector("#camera_feed_container");

        // Add images for the 4 feeds to select.
        var static_images = [
            "https://media.giphy.com/media/M6hgceLnI2uJi/giphy.gif",
            "https://media.giphy.com/media/Yqn9tE2E00k4U/giphy.gif",
            "https://media.giphy.com/media/XuBNdP9Pb7W9i/giphy.gif",
            "https://media.giphy.com/media/ECeEafzJSLDoc/giphy.gif"
        ]

        for (var i=0; i<static_images.length; i++) {
            // A div to contain the feeds.
            var feed_div = document.createElement('div');
            feed_div.id = `feeds${i}`;
            feed_div.className = 'grid-item';
            foreground.append(feed_div);

            // An image of the camera static.
            var camera_static_div = document.createElement('div');
            camera_static_div.data_index = i; // Used to tell which feed was pressed.
            camera_static_div.className = 'camera_static';
            camera_static_div.style.backgroundImage = `url(${static_images[i]})`;
            feed_div.append(camera_static_div);

            // A label indicating the name of the camera feed.
            var feed_label = document.createElement('h2');
            feed_label.className = 'feed_label';
            feed_label.innerHTML = `feed 0${i}`;
            feed_div.append(feed_label);

            // Line showing the color associated with the camera.
            var color_div = document.createElement('div');
            color_div.className = 'camera_color_line';
            color_div.style.backgroundColor = this._camera_feed_colors[i];
            feed_div.append(color_div);

            // Add touch events for pressing
            add_press_event_listener(camera_static_div, pressed);

            var _this = this;
            function pressed() {
                _this.on_feed_pressed(this.data_index);
            }
        }
    },

    show: function() {
        this._background.style.display = 'block';
    },

    hide: function() {
        this._background.style.display = 'none';
    }
};
