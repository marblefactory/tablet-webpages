
// The location of a camera in the game, and whether the user is viewing the
// camera feed.
function Camera(game_loc, is_active) {
    this.game_loc = game_loc;
    this.is_active = is_active;
}

function Model() {
    this.num_floors = 3;
    this.floor_names = ['Basement', 'Floor 1', 'Roof'];
    // The boundaries of the 3d game. The locations of objects cannot go
    // outside these boundaries.
    this.game_boundaries = null;

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
        var _this = this;
        this._get_boundaries(function() {
            get('positions', function(response) {
                var locations = JSON.parse(response);

                _this.floor_num = locations.floor_num;
                _this.spy_game_loc = locations.spy_loc;
                _this.guard_game_locs = locations.guard_locs;
                _this.game_cameras = locations.cameras;

                if (!_this._called_onload) {
                    _this.onload();
                    _this._called_onload = true;
                }

                callback();

                setTimeout(function() {
                    _this.poll_positions(interval_time, callback);
                }, interval_time);
            });
        });
    }
}
