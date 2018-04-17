
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

Point.from_json = function(json) {
    var x = checkJsonHas(json, 'x', 'Point');
    var y = checkJsonHas(json, 'y', 'Point');

    return new Point(x, y);
};

function Boundaries(min_x, min_y, max_x, max_y) {
    this.min_x = min_x;
    this.min_y = min_y;
    this.max_x = max_x;
    this.max_y = max_y;
}

Boundaries.from_json = function(json) {
    var min_x = checkJsonHas(json, 'min_x', 'Boundaries');
    var min_y = checkJsonHas(json, 'min_y', 'Boundaries');
    var max_x = checkJsonHas(json, 'max_x', 'Boundaries');
    var max_y = checkJsonHas(json, 'max_y', 'Boundaries');

    return new Boundaries(min_x, min_y, max_x, max_y);
};

/**
 * @param {Point} game_loc - the location of the camera in the game.
 * @param {number} max_visibility_dist - the maximum distance from the camera
 *                                       which guards can be automatically detected.
 * @param {number} feed_index - the index 0-4 corresponding to the feed of the
 *                              camera. Or, null if the camera is not active.
 * @param {number} id - the id in the game of the camera.
 */
function Camera(game_loc, max_visibility_dist, feed_index, id) {
    this.loc = game_loc;
    this.max_visibility_dist = max_visibility_dist;
    this.feed_index = feed_index;
    this.id = id;
}

Camera.from_json = function(json) {
    var feed_index = checkJsonHas(json, 'feed_index', 'Camera');
    var max_visibility_dist = checkJsonHas(json, 'max_visibility_dist', 'Camera');
    var loc = Point.from_json(checkJsonHas(json, 'loc', 'Camera'));
    var id = checkJsonHas(json, 'id', 'Camera');

    return new Camera(loc, max_visibility_dist, feed_index, id);
};

/**
 * @param {number} dir_rad - the angle in radian, that the spy is facing.
 * @param {Point} game_loc - the location of the spy in the game.
 * @param {number} floor_index - the index of the floor the is on.
 */
function Spy(dir_rad, game_loc, floor_index) {
    this.dir_rad = dir_rad;
    this.game_loc = game_loc;
    this.floor_index = floor_index;
}

/**
 * Parses a Spy from a json object.
 */
Spy.from_json = function(json) {
    var dir_rad = checkJsonHas(json, 'dir_rad', 'Spy');
    var game_loc = Point.from_json(checkJsonHas(json, 'loc', 'Spy'));
    var floor_index = checkJsonHas(json, 'floor_index', 'Spy');

    return new Spy(dir_rad, game_loc, floor_index);
}

/**
 * Represents a target that the spy is trying to reach.
 */
function Target(game_loc, floor_index) {
    this.game_loc = game_loc;
    this.floor_index = floor_index;
}

/**
 * Parses a Target from a json object.
 */
Target.from_json = function(json) {
    var game_loc = Point.from_json(checkJsonHas(json, 'loc', 'Target'));
    var floor_index = checkJsonHas(json, 'floor_index', 'Target');

    return new Target(game_loc, floor_index);
}

/**
 * @param {[string]} camera_feed_colors - the colors associated with each of the 4 feeds.
 */
function Model(camera_colors) {
    // The index of the floor selected to view, or -1 if the minimap should
    // follow the spy as they move between floors.
    this._selected_floor = -1;
    this.num_floors = 3;
    this.floor_names = ['Basement', 'Floor 1', 'Roof'];
    // The boundaries of the 3d game. The locations of objects cannot go
    // outside these boundaries.
    this.game_boundaries = null;

    this.spy = null;
    this.game_guards_locs = null;
    this.game_cameras = null;

    this.game_target = null;

    // The color associated with each camera. This is used to make it easier
    // to tell which camera corresponds to which feed.
    this.camera_colors = camera_colors;

    // Called once the positions of objects have been retreived the first time.
    this.onload = function() {};
    this._called_onload = false;

    // Called when the model is updated via a poll to the game server.
    this.on_poll = function() {};
}

Model.prototype = {
    /**
     * Gets the boundaries of the map in the game. The boundaries are used to
     * convert between 3D game positions, and positions on the minimap.
     */
    get_boundaries: function(callback) {
        var _this = this;
        get('boundaries', function(response) {
            _this.game_boundaries = Boundaries.from_json(JSON.parse(response));
            callback();
        });
    },

    /**
     * Gets the boundaries of the map then polls the spy and guards position
     * interval_time after the last position was received.
     */
    poll_positions_every: function(interval_time) {
        this.poll_positions();
        setTimeout(() => this.poll_positions_every(interval_time), interval_time);
    },

    /**
     * Polls the positions of the game objects once.
     */
    poll_positions: function() {
        // A floor number of -1 indicates that we want the server to send
        // back the floor on which the spy is.
        var floor_num_obj = {
            floor_num: this._selected_floor
        };

        var _this = this;
        post_obj('positions', floor_num_obj, function(response) {
            _this.update_from_game_response(response);
            _this.on_poll();
        });
    },

    /**
     * Updates the state of the model from a response from the game.
     */
    update_from_game_response(response) {
        var locations = JSON.parse(response);

        var game_spy_json = checkJsonHas(locations, 'spy', 'Model');
        var game_target_json = checkJsonHas(locations, 'target', 'Model');

        this.spy = Spy.from_json(game_spy_json);
        this.game_guards_locs = checkJsonHas(locations, 'guards_locs', 'Model').map(Point.from_json);
        this.game_cameras = checkJsonHas(locations, 'cameras', 'Model').map(Camera.from_json);
        this.game_target = Target.from_json(game_target_json);

        if (!this._called_onload) {
            this.onload();
            this._called_onload = true;
        }
    },

    /**
     * Updates the feed indices of the new game and camera which previously
     * had a feed_index of `replace_feed_index`.
     */
    update_camera_feed_indices: function(new_camera_game_id, replace_feed_index) {
        var new_camera_idx = this.game_cameras.findIndex(cam => cam.id == new_camera_game_id);
        var old_camera_idx = this.game_cameras.findIndex(cam => cam.feed_index == replace_feed_index);

        // If there isn't a camera already with that feed, simply set the
        // feed of the new camera.
        if (old_camera_idx == -1) {
            this.game_cameras[new_camera_idx].feed_index = replace_feed_index;
        }
        else {
            this.game_cameras[new_camera_idx].feed_index = this.game_cameras[old_camera_idx].feed_index;
            this.game_cameras[old_camera_idx].feed_index = null;
        }
    },

    /**
     * @return the index of the floor to display. Either the selected floor
     *         index, or the index of the floor the spy is on if following the spy.
     */
    view_floor_index: function() {
        if (this._selected_floor == -1) {
            return this.spy.floor_index;
        }
        return this._selected_floor;
    },

    /**
     * Sets the selected floor index to either be the index of the selected
     * floor, or the to automatically follow the spy if the floor with the
     * spy on is selected.
     */
    set_selected_floor: function(floor_index) {
        if (floor_index == this.spy.floor_index) {
            this._selected_floor = -1;
        }
        else {
            this._selected_floor = floor_index;
        }
    },

    /**
     * @return {number} the maximum distance two objects can be apart from each other.
     */
    max_dist: function() {
        var game_width = this.game_boundaries.max_x - this.game_boundaries.min_x;
        var game_height = this.game_boundaries.max_y - this.game_boundaries.min_y;

        return Math.hypot(game_width, game_height);
    }
}
