
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

    /**
     * Linearly interpolates between this point and the end point.
     */
    this.lerped = function(end, t) {
        var x = lerp(this.x, end.x, t);
        var y = lerp(this.y, end.y, t);
        return new Point(x, y);
    }

    /**
     * @return {Point} the result of adding the component of this point and the
     *                 other point.
     */
    this.added = function(other) {
        return new Point(this.x + other.x, this.y + other.y);
    }
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

    this.render_height = screen_height * 0.9;
    this.render_width = image.width * (this.render_height / image.height);

    this.start_x = (screen_width - this.render_width) / 2;
    this.start_y = (screen_height - this.render_height) / 2;
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
    this.opacity = 0.0;
    this.delta_opacity = -0.002;
    this.min_opacity = 0.2;
    // Set to false when a new marker is created. Therefore letting this
    // marker fade away and be deleted.
    this.can_update_opacity = true;
}

// Represents a camera marker on the minimap, which is used to display a
// camera icon and plusing sphere to show with cameras are active.
function CameraMarker(minimap_loc, feed_index, max_pulse_dist, game_id) {
    this.minimap_loc = minimap_loc;
    this.feed_index = feed_index;
    // The maximum time before a new pulse is made.
    this.start_time_before_pulse = 250;
    // The time remaining before a pulse is made. A pulse is made immediately
    // when the camera is created.
    this.time_before_pulse = 0;
    // The maximum distance on the minimap which pulses can travel.
    this.max_pulse_dist = max_pulse_dist;
    // The id of the camera in the game.
    this.game_id = game_id;
}

// Represents a radar pulse from a camera.
function CameraPulse(minimap_loc, max_radius, screen_max_dist) {
    this.minimap_loc = minimap_loc;
    this.color = 'white';
    this.radius = 0;
    this.max_radius = max_radius;
    this.max_opacity = 0.28;

    // The minimum and maximum rate at which the radius can increase.
    // Randomness helps make the cameras look less 'samey'.
    var min_delta_r = screen_max_dist * 0.00032;//0.5;
    var max_delta_r = screen_max_dist * 0.00035;//0.55;

    this.delta_radius = Math.random() * (max_delta_r - min_delta_r) + min_delta_r;

    this.update = function() {
        this.radius += this.delta_radius;
    };
}

// Represents a target marker. The radius of the marker decreases as the spy
// gets closer to the target.
function TargetMarkerState(minimap_loc, radius, floor_index) {
    this.minimap_loc = minimap_loc;
    this.radius = radius;
    this.floor_index = floor_index;
}

// Represents the states of the target marker. These are required for
// animations from the old to new state, e.g. shrinking radius.
function TargetMarker() {
    this.new_state = null;
    this.old_state = null;

    // The maximum percentage of the radius of the marker to offset the marker
    // by. Therefore randomising the position of the marker and making it
    // harder to find the target.
    this.jitter_radius_multiplier = 0.6;

    this.anim_duration_ms = 200;
    // The time that the animation started. Used to tell how far along the
    // animation should be.
    this.anim_start = null;
}

TargetMarker.prototype = {
    /**
     * @return {Point} a random point in a circle with origin (0,0) and radius r.
     */
    _rand_point_in_radius: function(r) {
        var x = Math.random() * r * 2 - r;
        var y = Math.random() * r * 2 - r;
        return new Point(x, y);
    },

    /**
     * Updates the new and old states based on the new position of the spy,
     * and target.
     */
    update: function(minimap_loc, floor_index, spy_dist, max_dist, min_radius, max_radius) {
        var new_radius = spy_dist / max_dist * (max_radius - min_radius) + min_radius;

        // Add a random x and y to the position, which decreases as the spy
        // gets closer to the target.
        var jitter_radius = new_radius * this.jitter_radius_multiplier;
        var jittered_loc = this._rand_point_in_radius(jitter_radius);

        this.old_state = this.new_state;
        this.new_state = new TargetMarkerState(jittered_loc.added(minimap_loc), new_radius, floor_index);

        this.anim_start = Date.now();
    },

    /**
     * @return {TargetMarkerState} the state interpolated between the old and
     *         new states to animate from one state to the other over time.
     */
    lerped_state: function() {
        if (this.old_state === null) {
            return this.new_state;
        }

        // The proportion of the animation should be completed.
        var curr_time = Date.now();
        var tt = (curr_time - this.anim_start) / this.anim_duration_ms;
        var t = tt * tt;

        if (t >= 1.0) {
            return this.new_state;
        }

        var loc = this.old_state.minimap_loc.lerped(this.new_state.minimap_loc, t);
        var radius = lerp(this.old_state.radius, this.new_state.radius, t);

        return new TargetMarkerState(loc, radius, this.new_state.floor_index);
    }
};

/**
 * @param {Canvas} canvas - used to draw the minimap.
 * @param {Boundaries} model - used to get information about what to display.
 */
function Minimap(canvas, model) {
    this.model = model;
    this.ctx = canvas.getContext('2d');

    // Make the canvas fullscreen.
    this.ctx.canvas.width = window.innerWidth;
    this.ctx.canvas.height = window.innerHeight;

    this.spy_marker = null;
    this.guard_markers = [];
    this.camera_markers = [];
    this.target_marker = new TargetMarker();

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

    this.floor_maps = [];
    this.grid_background = null;
    this.cctv_icon = null;

    // Add event handlers for touching the canvas.
    // This allows the index of the camera pressed to be sent back to the server.
    add_press_event_listener(canvas, this._handle_canvas_pressed.bind(this));
}

Minimap.prototype = {
    load_images: function(callback) {
        var image_names = [
            'images/cctv_icon.png',
            'images/floor_maps/floor2.png',
            'images/floor_maps/floor1.png',
            'images/floor_maps/floor0.png'
        ]

        preload(image_names, complete.bind(this));

        function complete(images) {
            this.cctv_icon = images.pop();
            this.floor_maps = images.map(img => new FloorMap(img, this.width(), this.height()));
            callback();
        }
    },

    width: function() {
        return this.ctx.canvas.width;
    },

    height: function() {
        return this.ctx.canvas.height;
    },

    max_render_dist: function() {
        var floormap = this.current_floormap();
        return Math.hypot(floormap.render_width, floormap.render_height);
    },

    current_floormap: function() {
        return this.floor_maps[this.model.view_floor_index()];
    },

    _guard_marker_radius: function() {
        return Math.min(this.width() * 0.008, 50);
    },

    _spy_marker_radius: function() {
        return Math.min(this.width() * 0.0155, 50);
    },

    _camera_icon_radius: function() {
        return Math.min(this.width() * 0.0125, 50);
    },

    _target_marker_min_radius: function() {
        return Math.min(this.current_floormap().render_width * 0.012, 50);
    },

    _target_marker_max_radius: function() {
        return this.current_floormap().render_width * 1.0;
    },

    /**
     * Returns a horizontal distance in the game into a horizontal distance
     * in the minimap.
     */
    _convert_game_dist_to_minimap: function(game_dist) {
        return game_dist * this.max_render_dist() / this.model.max_dist();
    },

    /**
     * Returns the point in game coordinates into minimap coordinates.
     */
    _convert_to_minimap_point: function(game_point) {
        var floormap = this.current_floormap();

        var game_w = (this.model.game_boundaries.max_x - this.model.game_boundaries.min_x);
        var width_mult = floormap.render_width / game_w;

        var game_h = (this.model.game_boundaries.max_y - this.model.game_boundaries.min_y);
        var height_mult = floormap.render_height / game_h;

        var minimap_x = (game_point.x - this.model.game_boundaries.min_x) * width_mult + floormap.start_x;
        var minimap_y = (game_point.y - this.model.game_boundaries.min_y) * height_mult + floormap.start_y;

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
                this.on_camera_pressed(this.camera_markers[i].game_id);
            }
        }
    },

    /**
     * Fills the background with a grid image.
     */
    _draw_background_grid: function() {
        this.ctx.clearRect(0, 0, this.width(), this.height());
    },

    /**
     * Draws the background map.
     */
    _draw_background_image: function() {
        var floormap = this.current_floormap();
        this.ctx.drawImage(floormap.image, floormap.start_x, floormap.start_y, floormap.render_width, floormap.render_height);
    },

    /**
     * Draws the marker on the minimap.
     * @{{minimap_loc: {x: number, y: number}, radius: number, color: string}} marker - describes the circular marker to draw.
     */
    _draw_marker(marker) {
        fill_circle(this.ctx, marker.minimap_loc.x, marker.minimap_loc.y, marker.radius, marker.color);
        stroke_circle(this.ctx, marker.minimap_loc.x, marker.minimap_loc.y, marker.radius, 1, 'white');
    },

    /**
     * Draws a marker for spy with a center at the given position.
     * @param {SpyMarker} marker - the marker to draw.
     */
    _draw_spy_marker: function(marker) {
        // If the spy is not on the same floor, draw with reduced alpha to
        // be able to tell where the spy is at all times.
        var alpha = this.model.spy.floor_index === this.model.view_floor_index() ? 1.0 : 0.25;

        // Draw an indicator of the direction the spy is facing.
        var dx = marker.minimap_loc.x;
        var dy = marker.minimap_loc.y;
        draw_with_alpha(this.ctx, alpha, draw_translated_arrow.bind(this));

        function draw_translated_arrow() {
            draw_with_translation(this.ctx, dx, dy, draw_rotated_arrow.bind(this))
        }

        function draw_rotated_arrow() {
            draw_with_rotation(this.ctx, this.model.spy.dir_rad, draw_arrow_at_horizontal.bind(this));
        }

        // Draws an arrow pointing horzontally to the right.
        function draw_arrow_at_horizontal() {
            var offset = Math.PI * 0.8;
            var p1 = point_on_circle(marker.radius, offset);
            var p2 = point_on_circle(marker.radius, 0);
            var p3 = point_on_circle(marker.radius, -offset);

            // Black triangle.
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.lineTo(p3.x, p3.y);
            this.ctx.fillStyle = 'black';
            this.ctx.fill();

            // White stroke around triangle.
            this.ctx.lineTo(p1.x, p1.y);
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = 'white';
            this.ctx.stroke();
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
        var camera_color = marker.feed_index == null ? 'white' : this.model.camera_colors[marker.feed_index];

        // Draw the background for the icon. Because the center of the camera
        // icon is transparent, this color will show through behind.
        fill_circle(this.ctx, marker.minimap_loc.x, marker.minimap_loc.y, icon_radius, camera_color);

        this.ctx.drawImage(this.cctv_icon,
                           marker.minimap_loc.x - icon_radius,
                           marker.minimap_loc.y - icon_radius,
                           icon_radius * 2,
                           icon_radius * 2);

        // Stroke around the camera with its feed color, or white.
        stroke_circle(this.ctx, marker.minimap_loc.x, marker.minimap_loc.y, icon_radius, 1, camera_color);
    },

    /**
     * Draws a pulse, but doesn't update it's opacity or radius.
     * @param {CameraPulse} pulse - the pulse to draw.
     */
    _draw_pulse: function(pulse) {
        if (pulse.radius > pulse.max_radius) {
            return;
        }

        // The opacity of the pulse is determined by linearly interpolation.
        var opacity = lerp(pulse.max_opacity, 0.0, pulse.radius / pulse.max_radius);

        draw_with_alpha(this.ctx, opacity, stroke_pulse.bind(this));
        function stroke_pulse() {
            stroke_circle(this.ctx, pulse.minimap_loc.x, pulse.minimap_loc.y, pulse.radius, 2, pulse.color)
        }
    },

    /**
     * Draws a target marker, but doesn't update its radius.
     * @param {TargetMarker} marker - the marker to draw.
     */
    _draw_target_marker: function(marker) {
        var _this = this;
        var state = marker.lerped_state();

        // Draw a blurred circle to indicate the area the target is in.
        function blurred_circle() {
            var pos = state.minimap_loc;
            var radius = state.radius;

            //var radgrad = _this.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 60);
            var radgrad = _this.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
            radgrad.addColorStop(0.00, '#FF0F');
            radgrad.addColorStop(0.85, '#FF0B');
            radgrad.addColorStop(1.00, '#FF00');

            _this.ctx.fillStyle = radgrad;
            _this.ctx.fillRect(pos.x-radius, pos.y-radius, radius*2, radius*2);
        }

        var alpha = this.model.view_floor_index() == state.floor_index ? 0.5 : 0.15;
        draw_with_alpha(this.ctx, alpha, blurred_circle);
    },

    /**
     * Draws the markers, pulses, and background.
     */
    _draw: function() {
        this._draw_background_grid();
        this._draw_background_image(this.model.view_floor_index());

        // Draw and update the camera radar pulses.
        for (var i=0; i<this._pulses.length; i++) {
            this._draw_pulse(this._pulses[i]);
        }

        // Draw the area the target is in.
        this._draw_target_marker(this.target_marker);

        // Draw the camera positions.
        for (var i=0; i<this.camera_markers.length; i++) {
            this._draw_camera_marker(this.camera_markers[i]);
        }

        // Draw the radar markers for the guards.
        for (var i=0; i<this.guard_markers.length; i++) {
            this._draw_guard_marker(this.guard_markers[i]);
        }

        // Draw the radar markers for the spy on top of everything else.
        this._draw_spy_marker(this.spy_marker);
    },

    /**
     * Updates the guard markers - if a camera pulse hits them then their
     * opacity returns to full, like a radar marker. If their opacity is too
     * low, then the marker is removed.
     */
    _update_guard_markers: function() {
        // Returns whether the point (x, y) lies within the defined ring.
        function is_inside_ring(center, r_outer, r_inner, point) {
            var dist = center.dist_to(point);
            return r_inner <= dist && dist <= r_outer;
        }

        for (var i=this.guard_markers.length-1; i >= 0; i--) {
            var marker = this.guard_markers[i];

            if (marker.opacity > 0) {
                marker.opacity += marker.delta_opacity;
            }
            else if (marker.opacity <= 0 && !marker.can_update_opacity) {
                // Remove the marker if the opacity is too low.
                this.guard_markers.splice(i, 1);
            }

            if (marker.can_update_opacity) {
                // Check whether a pulse is touching the marker.
                for (var j=0; j<this._pulses.length; j++) {
                    var pulse = this._pulses[j];

                    // The offset to the radius of the pulse, creating a ring in
                    // which to check whether the marker lies.
                    var offset = marker.radius;
                    var r_outer = pulse.radius + offset;
                    var r_inner = pulse.radius - offset;

                    if (is_inside_ring(pulse.minimap_loc, r_outer, r_inner, marker.minimap_loc)) {
                        marker.opacity = 1.0;
                    }
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

            if (pulse.radius <= pulse.max_radius) {
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
        if (camera_marker.feed_index != null && camera_marker.time_before_pulse < 0) {
            camera_marker.time_before_pulse = camera_marker.start_time_before_pulse;
            var pulse = new CameraPulse(camera_marker.minimap_loc, camera_marker.max_pulse_dist, this.max_render_dist());
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
            this._draw();
            this._update();
        }
    },

    /**
     * Refreshers the marker for the location of the spy on the map.
     */
    _refresh_spy_loc: function() {
        var minimap_loc = this._convert_to_minimap_point(this.model.spy.game_loc);
        this.spy_marker = new SpyMarker(minimap_loc, 'black', this._spy_marker_radius());
    },

    /**
     * Refreshers the markers for the location of the guards on the map.
     */
    _refresh_guard_locs: function() {
        // Tell the old markers not to be given any more opacity, therefore
        // letting them fade away.
        for (var i=0; i<this.guard_markers.length; i++) {
            this.guard_markers[i].can_update_opacity = false;
        }

        // Add the new markers.
        for (var i=0; i<this.model.game_guards_locs.length; i++) {
            var minimap_loc = this._convert_to_minimap_point(this.model.game_guards_locs[i]);
            var marker = new GuardMarker(minimap_loc, 'red', this._guard_marker_radius());
            this.guard_markers.push(marker);
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
                // This is used to create a marker, which can be properly
                // initialised after.
                var marker = new CameraMarker(new Point(0, 0), false, this._camera_icon_radius());
                marker.time_before_pulse = 0;
                this.camera_markers.push(marker);
            }
        }

        // Update camera markers from the game data.
        for (var i=0; i<game_cameras.length; i++) {
            var marker = this.camera_markers[i];
            var game_camera = game_cameras[i];

            marker.minimap_loc = this._convert_to_minimap_point(game_camera.loc);
            marker.feed_index = game_camera.feed_index;
            marker.max_pulse_dist = this._convert_game_dist_to_minimap(game_camera.max_visibility_dist);
            marker.game_id = game_camera.id;
        }
    },

    /**
     * Refreshes the position of the target.
     */
    _refresh_target: function() {
        var minimap_loc = this._convert_to_minimap_point(this.model.game_target.game_loc);

        var min_radius = this._target_marker_min_radius();
        var max_radius = this._target_marker_max_radius();

        var spy_dist = this.spy_marker.minimap_loc.dist_to(minimap_loc);
        var max_minimap_dist = this._convert_game_dist_to_minimap(this.model.max_dist());

        this.target_marker.update(minimap_loc, this.model.game_target.floor_index,
                                  spy_dist, max_minimap_dist, min_radius, max_radius);
    },

    /**
     * Refreshes the minimap with the position of the spy, guards, and cameras.
     */
    refresh_positons: function() {
        this._refresh_spy_loc();
        this._refresh_guard_locs();
        this._refresh_camera_locs();
        this._refresh_target();
        this._draw();
    },

    /**
     * Clears all the guard markers, camera markers, and camera pulses.
     * Useful for when the current floor is changed to stop anything being
     * drawn off the floor map.
     */
    clear_markers: function() {
        this.guard_markers = [];
        this.camera_markers = [];
        this._pulses = [];
        this._draw();
    }
};
