
// The location of a camera in the game, and whether the user is viewing the
// camera feed.
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
 * @param {[string]} camera_feed_colors - the colors associated with each of the 4 feeds.
 */
function Model(camera_colors) {
    this.floor_num = 0;
    this.num_floors = 3;
    this.floor_names = ['Basement', 'Floor 1', 'Roof'];
    // The boundaries of the 3d game. The locations of objects cannot go
    // outside these boundaries.
    this.game_boundaries = null;

    // The direction the spy is looking in.
    this.spy_dir_rad = null;

    // The positions of objects in the game.
    this.spy_game_loc = null;
    this.game_guards = null;
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
                floor_num: -1
            };

            post_obj('positions', floor_num_obj, function(response) {
                var locations = JSON.parse(response);

                _this.spy_dir_rad = locations.spy_dir_rad;
                _this.floor_num = locations.floor_num;
                _this.spy_game_loc = locations.spy_loc;
                _this.game_guards = locations.guards;
                _this.game_cameras = locations.cameras;

                if (!_this._called_onload) {
                    _this.onload();
                    _this._called_onload = true;
                }

                callback();

                setTimeout(poll, interval_time);
            });
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
        } else {
            this.game_cameras[new_camera_idx].feed_index = this.game_cameras[old_camera_idx].feed_index;
            this.game_cameras[old_camera_idx].feed_index = null;
        }
    }
}
