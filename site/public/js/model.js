
function Model() {
    this.num_floors = 3;
    this.floor_names = ['Basement', 'Floor 1', 'Roof'];
    // The boundaries of the 3d game. The locations of objects cannot go
    // outside these boundaries.
    this.game_boundaries = null;

    // The positions of objects in the game.
    this.spy_game_loc = null;
    this.guard_game_locs = null;
    this.camera_game_locs = null;
}

Model.prototype = {
    /**
     * Gets the boundaries of the map in the game. The boundaries are used to
     * convert between 3D game positions, and positions on the minimap.
     */
    get_boundaries: function(callback) {
        var _this = this;
        get('boundaries', function(response) {
            _this.game_boundaries = JSON.parse(response);
            callback();
        });
    },

    /**
     * Polls the spy and guards position interval_time after the last position
     * was received. callback is called only once when positions.
     */
    poll_positions: function(interval_time, callback) {
        var _this = this;
        get('positions', function(response) {
            var locations = JSON.parse(response);

            _this.floor_num = locations.floor_num;
            _this.spy_game_loc = locations.spy_loc;
            _this.guard_game_locs = locations.guard_locs;
            _this.camera_game_locs = locations.camera_locs;

            // Used to only call the callback once.
            if (callback != null) {
                callback();
            }

            setTimeout(function() {
                _this.poll_positions(interval_time, null)
            }, interval_time);
        });
    }
}
