
// The location of a camera in the game, and whether the user is viewing the
// camera feed.
/**
 * @param {Point} game_loc - the location of the camera in the game.
 * @param {boolean} is_active - whether the feed of the camera is being viewed.
 * @param {number} max_visibility_dist - the maximum distance from the camera
 *                                       which guards can be automatically detected.
 */
function Camera(game_loc, is_active, max_visibility_dist) {
    this.game_loc = game_loc;
    this.is_active = is_active;
    this.max_visibility_dist = max_visibility_dist;
}

function Model() {
    this.floor_num = 0;
    this.num_floors = 3;
    this.floor_names = ['Basement', 'Floor 1', 'Roof'];
    // The boundaries of the 3d game. The locations of objects cannot go
    // outside these boundaries.
    this.game_boundaries = null;

    // The direction the spy is looking in.
    this.spy_dir_deg = null;

    // The positions of objects in the game.
    this.spy_game_loc = null;
    this.guard_game_locs = null;
    this.game_cameras = null;

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

                _this.spy_dir_deg = locations.spy_dir_deg;
                _this.floor_num = locations.floor_num;
                _this.spy_game_loc = locations.spy_loc;
                _this.guard_game_locs = locations.guard_locs;
                _this.game_cameras = locations.cameras;

                if (!_this._called_onload) {
                _this.onload();
                _this._called_onload = true;
                }

                callback();

                setTimeout(poll, interval_time);
            });
        }
    }
}
