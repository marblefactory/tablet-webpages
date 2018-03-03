
function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Boundaries(min_x, min_y, max_x, max_y) {
    this.min_x = min_x;
    this.min_y = min_y;
    this.max_x = max_x;
    this.max_y = max_y;
}

/**
 * @param {Image} image - the blueprint of the floor plan.
 * @param {number} screen_width - the width of the screen, used to calculate
 *                                the width that the floor map should be
 *                                displayed at (it may not fill the entire width).
 * @param {number} screen_height - the height of the screen.
 */
function FloorMap(image, screen_width, screen_height) {
    this.image = image;
    this.render_width = image.width * (screen_height / image.height);
    this.start_x = (screen_width - this.render_width) / 2;
}

// Represents a marker for the spy on the map.
function SpyMarker(minimap_loc, color, radius) {
    this.minimap_loc = minimap_loc;
    this.color = color;
    this.radius = radius;
}

// Represents a marker on the minimap that fades over time.
function GuardMarker(minimap_loc, color, radius) {
    this.minimap_loc = minimap_loc;
    this.color = color;
    this.radius = radius;
    this.opacity = 1.0;
    this.delta_opacity = -0.0025;
}

// Represents a camera marker on the minimap, which is used to display a
// camera icon and plusing sphere to show with cameras are active.
function CameraMarker(minimap_loc, is_active, pulse_radius) {
    this.minimap_loc = minimap_loc;
    this.is_active = is_active;
    this.pulse_radius = pulse_radius;
    this.pulse_opacity = 0.8;

    var min_delta_r = 0.6;
    var max_delta_r = 0.8;

    this.delta_radius = Math.random() * (max_delta_r - min_delta_r) + min_delta_r;
    this.delta_opacity = -0.004;

    this.pulse_color = "white";
}

/**
 * @param {Canvas} canvas - used to draw the minimap.
 * @param {Boundaries} model - used to get information about what to display.
 */
function Minimap(canvas, model, onload) {
    this.model = model;
    this.ctx = canvas.getContext('2d');
    this.floor_label_elem = document.querySelector('#floor');

    this.spy_marker = null;
    this.guard_markers = null;
    this.camera_markers = null;

    // These variables are used for converting to minimap coordinates because
    // the floor map may not fit the screen exactly.
    this._floor_map_start_x = null;
    this._floor_map_width = null;

    // The time between refreshing the state of the minimap, i.e. positions
    // of objects.
    this.refresh_time_ms = 0.5;

    // Called when a camera icon is pressed. The index of the camera is given
    // to the callback.
    this.on_camera_pressed = function(index) {};

    // Preload the any images.
    this.floor_maps = [];
    this.cctv_icon = null;

    // Add all the preloaded background images to a dictionary.
    var _this = this;
    function loaded_background(key, background_img) {
        _this.floor_maps[key] = new FloorMap(background_img, screen.width, screen.height);

        // Call onload if all the background images have been loaded.
        if (Object.keys(_this.floor_maps).length === _this.model.num_floors) {
            onload();
        }
    }

    function preload_backgrounds() {
        for (var i=0; i<_this.model.num_floors; i++) {
            var img_name = 'images/floor_maps/floor' + i + '.png';
            _this._preload_image(img_name, i, loaded_background);
        }
    }

    function loaded_cctv_icon(_, cctv_icon) {
        _this.cctv_icon = cctv_icon;

        preload_backgrounds();
    }

    this._preload_image('images/cctv_icon.png', null, loaded_cctv_icon);

    // Add event handlers for touching the canvas.
    // This allows the index of the camera pressed to be sent back to the server.
    add_press_event_listener(canvas, this._handle_canvas_pressed.bind(this));
}

Minimap.prototype = {
    _preload_image: function(image_name, key, callback) {
        var img = new Image();
        img.src = image_name;

        var _this = this;
        img.onload = function() {
            callback(key, img);
        };
    },

    width: function() {
        return this.ctx.canvas.width;
    },

    height: function() {
        return this.ctx.canvas.height;
    },

    current_floormap: function() {
        return this.floor_maps[this.model.floor_num];
    },

    _marker_radius: function() {
        return Math.min(this.width() * 0.011, 50);
    },

    _camera_icon_radius: function() {
        return Math.min(this.width() * 0.02, 50);
    },

    /**
     * Returns the point in game coordinates into minimap coordinates.
     */
    _convert_to_minimap_point: function(game_point) {
        var floormap = this.current_floormap();

        var game_w = (this.model.game_boundaries.max_x - this.model.game_boundaries.min_x);
        var width_mult = floormap.render_width / game_w;

        var game_h = (this.model.game_boundaries.max_y - this.model.game_boundaries.min_y);
        var height_mult = this.height() / game_h;

        var minimap_x = (game_point.x - this.model.game_boundaries.min_x) * width_mult + floormap.start_x;
        var minimap_y = (game_point.y - this.model.game_boundaries.min_y) * height_mult;

        return new Point(minimap_x, minimap_y);
    },

    /**
     * Returns whether the given point is inside the bonding box.
     */
    _is_inside_box: function(point, box_center, box_radius) {
        return box_center.x - box_radius <= point.x
            && box_center.y - box_radius <= point.y
            && box_center.x + box_radius >= point.x
            && box_center.y + box_radius >= point.y;
    },

    // Get the position of the mouse relative to the canvas
    _get_press_loc: function(canvas_dom, event) {
        var rect = canvas_dom.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    },

    /**
     * The event called when the canvas is pressed. Used to tell the server
     * the index of the camera pressed.
     */
    _handle_canvas_pressed: function(event) {
        var press_loc = this._get_press_loc(this.ctx.canvas, event);

        // Check which camera was pressed, if any.
        for (var i=0; i<this.camera_markers.length; i++) {
            if (this._is_inside_box(press_loc, this.camera_markers[i].minimap_loc, this._camera_icon_radius())) {
                this.on_camera_pressed(i);
            }
        }
    },

    /**
     * Fills the background with a background color.
     */
    _draw_background_color: function() {
        this.ctx.fillStyle = "#1b5f9a";
        this.ctx.fillRect(0, 0, this.width(), this.height());
    },

    /**
     * Draws the background map.
     */
    _draw_background_image: function() {
        this.floor_label_elem.innerHTML = this.model.floor_names[this.model.floor_num];

        var floormap = this.current_floormap();
        this.ctx.drawImage(floormap.image, floormap.start_x, 0, floormap.render_width, this.height());
    },

    /**
     * Draws the marker on the minimap.
     * @{{minimap_loc: {x: number, y: number}, radius: number, color: string}} marker - describes the circular marker to draw.
     */
    _draw_marker(marker) {
        fill_circle(this.ctx, marker.minimap_loc.x, marker.minimap_loc.y, marker.radius, marker.color);
    },

    /**
     * Draws a marker for spy with a center at the given position.
     * @param {SpyMarker} marker - the marker to draw.
     */
    _draw_spy_marker: function(marker) {
        // Draw a circle for the spy.
        this._draw_marker(marker);

        // Draw an indicator of the direction the spy is facing.
        var dx = marker.minimap_loc.x;
        var dy = marker.minimap_loc.y;
        draw_with_translation(this.ctx, dx, dy, draw_rotated_arrow.bind(this))

        function draw_rotated_arrow() {
            draw_with_rotation(this.ctx, this.model.spy_dir_deg, draw_arrow_at_horizontal.bind(this));
        }

        // Draws an arrow pointing horzontally to the right.
        function draw_arrow_at_horizontal() {
            var offset = Math.PI * 0.8;
            var p1 = point_on_circle(marker.radius, offset);
            var p2 = point_on_circle(marker.radius, 0);
            var p3 = point_on_circle(marker.radius, -offset);

            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.lineTo(p3.x, p3.y);
            this.ctx.fillStyle = 'blue';
            this.ctx.fill();
        }

        // Returns a point on the edge of a circle at the origin.
        function point_on_circle(radius, angle_rads) {
            var x = radius * Math.cos(angle_rads);
            var y = radius * Math.sin(angle_rads);
            return {x, y};
        }
    },

    /**
     * Draws a marker for a guard with a center at the given position, and
     * updates the opacity of the marker.
     * @param {GuardMarker} marker - the marker to draw.
     */
    _draw_guard_marker: function(marker) {
        if (marker.opacity <= 0) {
            return;
        }

        draw_with_alpha(this.ctx, marker.opacity, () => this._draw_marker(marker));
        marker.opacity += marker.delta_opacity;
    },

    /**
     * Draws a marker for a camera and updates its pulse radius.
     * @param {CameraMarker} marker - the marker to draw.
     */
    _draw_camera_marker: function(marker) {
        var icon_radius = this._camera_icon_radius();
        this.ctx.drawImage(this.cctv_icon,
                           marker.minimap_loc.x - icon_radius,
                           marker.minimap_loc.y - icon_radius,
                           icon_radius * 2,
                           icon_radius * 2);

        // A white stroke around the icon.
        stroke_circle(this.ctx, marker.minimap_loc.x, marker.minimap_loc.y, icon_radius, 1, 'white');

        // The pulse (radar) coming from the camera.
        if (marker.is_active && marker.pulse_opacity > 0) {
            draw_with_alpha(this.ctx, marker.pulse_opacity, draw_pulse.bind(this));
            function draw_pulse() {
                stroke_circle(this.ctx, marker.minimap_loc.x, marker.minimap_loc.y, marker.pulse_radius, 2, marker.pulse_color)
            }

            marker.pulse_radius += marker.delta_radius;
            marker.pulse_opacity += marker.delta_opacity;
        }
    },

    /**
     * Refreshers the marker for the location of the spy on the map.
     */
    _refresh_spy_loc: function() {
        var minimap_loc = this._convert_to_minimap_point(this.model.spy_game_loc);
        this.spy_marker = new SpyMarker(minimap_loc, 'black', this._marker_radius() * 1.2);
    },

    /**
     * Refreshers the markers for the location of the guards on the map.
     */
    _refresh_guard_locs: function() {
        var guard_locs_2d = this.model.guard_game_locs.map(this._convert_to_minimap_point.bind(this));
        this.guard_markers = guard_locs_2d.map(loc => new GuardMarker(loc, 'red', this._marker_radius()));
    },

    /**
     * Refreshers markers for cameras at the given locations on the map.
     */
    _refresh_camera_locs: function() {
        var _this = this;

        /**
         * Returns a camera marker which can be displayed on the minimap.
         * @param {Camera} game_camera - a camera in game coordinates.
         */
        function transform(game_camera) {
            var minimap_loc = _this._convert_to_minimap_point(game_camera.loc);
            return new CameraMarker(minimap_loc, game_camera.is_active, _this._camera_icon_radius());
        }

        this.camera_markers = this.model.game_cameras.map(transform);
    },

    /**
     * Draws the markers and background.
     */
    _draw: function() {
        this._draw_background_color();
        this._draw_background_image(this.model.floor_num);

        // Draw the camera positions.
        for (var i=0; i<this.camera_markers.length; i++) {
            this._draw_camera_marker(this.camera_markers[i]);
        }

        // Draw the radar markers for the spy.
        this._draw_spy_marker(this.spy_marker);

        // Draw the radar markers for the guards.
        for (var i=0; i<this.guard_markers.length; i++) {
            this._draw_guard_marker(this.guard_markers[i]);
        }
    },

    /**
     * Infinitely loops drawing the canvas with the game objects at locations
     * according to the model.
     */
    draw_loop: function() {
        setInterval(this._draw.bind(this), this.refresh_time_ms);
    },

    /**
     * Refreshes the minimap with the position of the spy, guards, and cameras.
     */
    refresh_positons: function() {
        this._refresh_spy_loc(this.model.spy_game_loc);
        this._refresh_guard_locs(this.model.guard_game_locs);
        this._refresh_camera_locs(this.model.camera_game_locs);
    },

    /**
     * Resizes the canvas to fit to fullscreen.
     */
    fullscreen: function() {
        this.ctx.canvas.width = window.innerWidth;
        this.ctx.canvas.height = window.innerHeight;
    }
};
