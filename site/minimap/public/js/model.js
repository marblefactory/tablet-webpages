
/**
 * @param {Point} game_loc - the location of the camera in the game.
 * @param {number} max_visibility_dist - the maximum distance from the camera
 *                                       which guards can be automatically detected.
 * @param {number} feed_index - the index 0-4 corresponding to the feed of the
 *                              camera. Or, null if the camera is not active.
 * @param {number} id - the id in the game of the camera.
 */
function Camera(game_loc, max_visibility_dist, feed_index, id) {
    this.game_loc = game_loc;
    this.max_visibility_dist = max_visibility_dist;
    this.feed_index = feed_index;
    this.id = id;
}

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
    var game_loc = checkJsonHas(json, 'loc', 'Spy');
    var floor_index = checkJsonHas(json, 'floor_index', 'Spy');

    return new Spy(dir_rad, game_loc, floor_index);
}

/**
 * @param {[string]} camera_feed_colors - the colors associated with each of the 4 feeds.
 */
function Model(camera_colors) {
    // The index of the floor selected to view, or -1 if the minimap should
    // follow the spy as they move between floors.
    this.selected_floor_index = -1;
    this.num_floors = 3;
    this.floor_names = ['Basement', 'Floor 1', 'Roof'];
    // The boundaries of the 3d game. The locations of objects cannot go
    // outside these boundaries.
    this.game_boundaries = null;

    this.spy = null;
    this.game_guards_locs = null;
    this.game_cameras = null;

    // The color associated with each camera. This is used to make it easier
    // to tell which camera corresponds to which feed.
    this.camera_colors = camera_colors;

    // Called once the positions of objects have been retreived the first time.
    this.onload = function() {};
    this._called_onload = false;
}

Model.prototype = {
    /**
     * Gets the boundaries of the map in the game. The boundaries are used to
     * convert between 3D game positions, and positions on the minimap.
     */
    _get_boundaries: function(callback) {
        var _this = this;
        get('boundaries', function(response) {
            _this.game_boundaries = JSON.parse(response);
            callback();
        });
    },

    /**
     * Gets the boundaries of the map then polls the spy and guards position
     * interval_time after the last position was received.
     */
    poll_positions: function(interval_time, callback) {
        this._get_boundaries(function() {
            poll();
        });

        var _this = this;
        function poll() {
            // A floor number of -1 indicates that we want the server to send
            // back the floor on which the spy is.
            var floor_num_obj = {
                floor_num: this.selected_floor_index
            };

            post_obj('positions', floor_num_obj, function(response) {
                _this.update_from_game_response(response);
                callback();

                setTimeout(poll, interval_time);
            });
        }
    },

    /**
     * Updates the state of the model from a response from the game.
     */
    update_from_game_response(response) {
        var locations = JSON.parse(response);

        this.spy = Spy.from_json(locations.spy);
        this.game_guards_locs = locations.guards_locs;
        this.game_cameras = locations.cameras;

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
        if (this.selected_floor_index == -1) {
            return this.spy.floor_index;
        }
        return this.selected_floor_index;
    }
}
