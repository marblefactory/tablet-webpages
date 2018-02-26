
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
 * @param {Canvas} canvas - used to draw the minimap.
 * @param {Boundaries} game_boundaries - used to convert between game and
 *                                       minimap coordinates.
 */
function Minimap(canvas, game_boundaries) {
    this.ctx = canvas.getContext('2d');
    this.num_floors = 3;
    this.floor_names = ['Basement', 'Floor 1', 'Roof'];
    this.floor_label_elem = document.querySelector('#floor');
    this.game_boundaries = game_boundaries;
    this.camera_locs = [];

    this.onload = function() {};

    // Preload the any images.
    this.background_images = [];
    this.cctv_icon = null;

    // Add all the preloaded background images to a dictionary.
    var _this = this;
    function loaded_background(key, background_img) {
        _this.background_images[key] = background_img;

        // Call onload if all the background images have been loaded.
        if (Object.keys(_this.background_images).length == _this.num_floors) {
            _this.onload();
        }
    }

    function preload_backgrounds() {
        for (var i=0; i<_this.num_floors; i++) {
            var img_name = 'images/floor_maps/floor' + i + '.jpg';
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
    canvas.addEventListener('click', this._handle_canvas_pressed.bind(this), false);
    canvas.addEventListener('touch', this._handle_canvas_pressed.bind(this), false);
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

    _marker_radius: function() {
        return Math.min(this.width() * 0.011, 50);
    },

    _camera_icon_radius: function() {
        return Math.min(this.width() * 0.02, 50);
    },

    /**
     * Resizes the canvas to fit to fullscreen.
     */
    fullscreen: function() {
        this.ctx.canvas.width = window.innerWidth;
        this.ctx.canvas.height = window.innerHeight;
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
        for (var i=0; i<this.camera_locs.length; i++) {
            if (this._is_inside_box(press_loc, this.camera_locs[i], this._camera_icon_radius())) {
                console.log(`Pressed camera ${i}`);

                // Which camera to replace with the new feed.
                var obj = {
                    replace_index: 0, // TODO
                    new_camera_index: i
                };

                post_obj('camera_chosen', obj);
            }
        }
    },

    /**
     * Draws the background map.
     */
    _draw_background: function(floor_num) {
        if (floor_num < 0 || floor_num > this.num_floors) {
            throw 'incorrect floor num: ' + floor_num
        }

        this.floor_label_elem.innerHTML = this.floor_names[floor_num];

        var floor_img = this.background_images[floor_num];
        this.ctx.drawImage(floor_img, 0, 0, this.width(), this.height());
    },

    /**
     * Returns the point in game coordinates into minimap coordinates.
     */
    _convert_to_minimap_point: function(game_point) {
        var game_w = (this.game_boundaries.max_x - this.game_boundaries.min_x);
        var width_mult = this.width() / game_w;

        var game_h = (this.game_boundaries.max_y - this.game_boundaries.min_y);
        var height_mult = this.height() / game_h;

        var minimap_x = (game_point.x - this.game_boundaries.min_x) * width_mult;
        var minimap_y = (game_point.y - this.game_boundaries.min_y) * height_mult;

        return new Point(minimap_x, minimap_y);
    },

    /**
     * Draws a marker for a guard, spy, etc with a center at the given position.
     */
    _draw_marker: function(game_pos, color) {
        var minimap_point = this._convert_to_minimap_point(game_pos);

        this.ctx.beginPath();
        this.ctx.arc(minimap_point.x, minimap_point.y, this._marker_radius(), 0, 2 * Math.PI, false);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    },

    /**
     * Draws the icon for a camera at the given position.
     */
    _draw_camera_icon: function(game_pos) {
        var minimap_point = this._convert_to_minimap_point(game_pos);
        var icon_radius = this._camera_icon_radius();

        this.ctx.drawImage(this.cctv_icon,
                           minimap_point.x - icon_radius,
                           minimap_point.y - icon_radius,
                           icon_radius * 2,
                           icon_radius * 2);
    },

    /**
     * Draws a marker for the location of the spy on the map.
     * @param {Point} game_pos - the position in the game of the spy.
     */
    _draw_spy: function(game_pos) {
        this._draw_marker(game_pos, 'black');
    },

    /**
     * Draws markers for the location of the guards on the map.
     * @param {[Point]} points - the positions of the guards in the game.
     */
    _draw_guards: function(points) {
        for (var i=0; i<points.length; i++) {
            this._draw_marker(points[i], 'red');
        }
    },

    /**
     * Draws markers for cameras at the given locations on the map.
     * @param {[Point]} points - the positions of cameras in the game.
     */
    _draw_cameras: function(points) {
        for (var i=0; i<points.length; i++) {
            this._draw_camera_icon(points[i]);
        }
    },

    /**
     * Draws the minimap with the position of the spy.
     * @param {Point} spy_loc - the position of the spy in the game.
     * @param {[Point]} guard_locs - the locations of the guards in the game.
     * @param {[Point]} camera_locs - the locations of the cameras in the game.
     */
    draw: function(spy_loc, guard_locs, camera_locs, floor_num) {
        this.camera_locs = camera_locs.map(this._convert_to_minimap_point.bind(this));

        this._draw_background(floor_num);
        this._draw_guards(guard_locs);
        this._draw_spy(spy_loc);
        this._draw_cameras(camera_locs);
    }
};

/**
 * Gets the boundaries of the map in the game. The boundaries are used to
 * convert between 3D game positions, and positions on the minimap.
 */
function get_game_map_boundaries(callback) {
    get('boundaries', function(response) {
        var boundaries = JSON.parse(response);
        callback(boundaries);
    });
}

/**
 * Polls the spy and guards position interval_time after the last position
 * was received.
 */
function poll_positions(interval_time, callback) {
    get('positions', function(response) {
        var locations = JSON.parse(response);
        callback(locations);
        setTimeout(function() {
            poll_positions(interval_time, callback)
        }, interval_time);
    });
}
