
function Point(x, y) {
    this.x = x;
    this.y = y;

    /**
     * @return {number} the distance from this point to the given point.
     */
    this.dist_to = function(point) {
        var dx = this.x - point.x;
        var dy = this.y - point.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
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
function CameraMarker(minimap_loc, is_active) {
    this.minimap_loc = minimap_loc;
    this.is_active = is_active;
    // The maximum time before a new pulse is made.
    this.start_time_before_pulse = 200;
    // The time remaining before a pulse is made. A pulse is made immediately
    // when the camera is created.
    this.time_before_pulse = 0;
}

// Represents a radar pulse from a camera.
function CameraPulse(minimap_loc, start_radius) {
    this.minimap_loc = minimap_loc;
    this.color = 'white';
    this.radius = start_radius;
    this.opacity = 0.8;

    // The minimum and maximum rate at which the radius can increase.
    // Randomness helps make the cameras look less 'samey'.
    var min_delta_r = 0.6;
    var max_delta_r = 0.8;

    this.delta_radius = Math.random() * (max_delta_r - min_delta_r) + min_delta_r;
    this.delta_opacity = -0.002;//-0.004;

    this.update = function() {
        this.radius += this.delta_radius;
        this.opacity += this.delta_opacity;
    };
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
    this.guard_markers = [];
    this.camera_markers = [];

    // These variables are used for converting to minimap coordinates because
    // the floor map may not fit the screen exactly.
    this._floor_map_start_x = null;
    this._floor_map_width = null;

    // The time between refreshing the context on which the minimap is drawn.
    this.draw_refresh_time_ms = 0.016; // 60 fps

    // All the radar pulses that have been emitted from cameras.
    this._pulses = [];

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
    },

    /**
     * Draws a pulse, but doesn't update it's opacity or radius.
     * @param {CameraPulse} pulse - the pulse to draw.
     */
    _draw_pulse: function(pulse) {
        if (pulse.opacity <= 0) {
            return;
        }

        draw_with_alpha(this.ctx, pulse.opacity, stroke_pulse.bind(this));
        function stroke_pulse() {
            stroke_circle(this.ctx, pulse.minimap_loc.x, pulse.minimap_loc.y, pulse.radius, 2, pulse.color)
        }
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

        // Draw the radar markers for the guards.
        for (var i=0; i<this.guard_markers.length; i++) {
            this._draw_guard_marker(this.guard_markers[i]);
        }

        // Draw and update the camera radar pulses.
        for (var i=0; i<this._pulses.length; i++) {
            this._draw_pulse(this._pulses[i]);
        }

        // Draw the radar markers for the spy on top of everything else.
        this._draw_spy_marker(this.spy_marker);
    },

    /**
     * Updates the guard markers - if a camera pulse hits them then their
     * opacity returns to full, like a radar marker.
     */
    _update_guard_markers: function() {
        // Returns whether the point (x, y) lies within the defined ring.
        function is_inside_ring(center, r_outer, r_inner, point) {
            var dist = center.dist_to(point);
            return r_inner <= dist && dist <= r_outer;
        }

        for (var i=0; i<this.guard_markers.length; i++) {
            var marker = this.guard_markers[i];
            marker.opacity += marker.delta_opacity;

            // Check whether a pulse is touching the marker.
            for (var j=0; j<this._pulses.length; j++) {
                var pulse = this._pulses[j];

                // The offset to the radius of the pulse, creating a ring in
                // which to check whether the marker lies.
                var offset = 10;
                var r_outer = pulse.radius + offset;
                var r_inner = pulse.radius - offset;

                if (is_inside_ring(pulse.minimap_loc, r_outer, r_inner, marker.minimap_loc)) {
                    marker.opacity = 1.0;
                }
            }
        }
    },

    /**
     * Updates all pulses - if the pulse has no strength (opacity) left then it
     * is removed from the collection of pulses.
     */
    _update_pulses: function() {
        // Iterate backwards so we can remove pulses that have lost all their
        // opacity.
        for (var i = this._pulses.length - 1; i >= 0; i--) {
            var pulse = this._pulses[i];

            if (pulse.opacity > 0) {
                pulse.update();
            } else {
                this._pulses.splice(i, 1);
            }
        }
    },

    /**
     * Creates pulses from active cameras that for which enough time has
     * elapsed since their last pulse.
     */
    _create_pulse_from_camera: function(camera_marker) {
        camera_marker.time_before_pulse -= 1;

        // If the camera is active, create a pulse from it.
        if (camera_marker.is_active && camera_marker.time_before_pulse <= 0) {
            camera_marker.time_before_pulse = camera_marker.start_time_before_pulse;
            var pulse = new CameraPulse(camera_marker.minimap_loc, this._camera_icon_radius());
            this._pulses.push(pulse);
        }
    },

    /**
     * Updates elements of the minimap, e.g. pulses.
     */
    _update: function() {
        // Create pulses from cameras that have waited long enough.
        for (var i=0; i<this.camera_markers.length; i++) {
            this._create_pulse_from_camera(this.camera_markers[i]);
        }

        // Update the radii and opactity of the pulses on the minimap.
        // We also need to remove any pulses that can no longer be seen.
        this._update_pulses();

        // Update whether the guard markers have been 'hit' by the pulses.
        this._update_guard_markers();
    },

    /**
     * Infinitely loops drawing the canvas, and updating, with the game objects
     * at locations according to the model.
     */
    run_loop: function() {
        setInterval(iter.bind(this), this.draw_refresh_time_ms);
        function iter() {
            this._update();
            this._draw();
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
        // var guard_locs_2d = this.model.guard_game_locs.map(this._convert_to_minimap_point.bind(this));
        // this.guard_markers = guard_locs_2d.map(loc => new GuardMarker(loc, 'red', this._marker_radius()));

        var guard_game_locs = this.model.guard_game_locs;

        // Add or remove guard markers so the number of guard_locs matches the
        // guard markers.
        if (this.guard_markers.length > guard_game_locs.length) {
            this.guard_markers = this.guard_markers.slice(0, guard_game_locs.length);
        }
        else {
            var num_to_add = guard_game_locs.length - this.guard_markers.length;
            for (var i=0; i<num_to_add; i++) {
                // This position will be filled in after.
                var marker = new GuardMarker(new Point(0, 0), 'red', this._marker_radius());
                this.guard_markers.push(marker);
            }
        }

        // Update camera markers from the game data.
        for (var i=0; i<guard_game_locs.length; i++) {
            var marker = this.guard_markers[i];
            marker.minimap_loc = this._convert_to_minimap_point(guard_game_locs[i]);
        }
    },

    /**
     * Refreshers markers for cameras at the given locations on the map.
     */
    _refresh_camera_locs: function() {
        var game_cameras = this.model.game_cameras;

        // Add or remove cameras so the number of game_cameras matches the
        // camera markers.
        if (this.camera_markers.length > game_cameras.length) {
            this.camera_markers = this.camera_markers.slice(0, game_cameras.length);
        }
        else {
            var num_to_add = game_cameras.length - this.camera_markers.length;
            for (var i=0; i<num_to_add; i++) {
                // This information will be fill in properly after.
                var marker = new CameraMarker(new Point(0, 0), false, this._camera_icon_radius());
                marker.time_before_pulse = 0;
                this.camera_markers.push(marker);
            }
        }

        // Update camera markers from the game data.
        for (var i=0; i<game_cameras.length; i++) {
            var marker = this.camera_markers[i];
            marker.minimap_loc = this._convert_to_minimap_point(game_cameras[i].loc);
            marker.is_active = game_cameras[i].is_active;
        }
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
