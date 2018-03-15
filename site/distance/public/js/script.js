
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

function Boundaries(min_x, min_y, max_x, max_y) {
    this.min_x = min_x;
    this.min_y = min_y;
    this.max_x = max_x;
    this.max_y = max_y;
}

/**
 * Converts the distance the spy is from the objective to a bar width,
 * indicating the distance. The width is returned as a proportion of the screen
 * width.
 *
 * @param {number} distance - the distance of the spy to the objective.
 * @param {number} max_dist - the maximum distance of the spy to the objective.
 */
function convert_dist_to_bar_proportion(distance, max_dist) {
    var prop_dist = (max_dist - distance) / max_dist;
    var clamped = prop_dist.clamp(0.05, 1.0);
    return clamped * 100.0; // To turn into percentage (0-100)
}


/**
 * Called once the boundaries of the game map have been recieved.
 * Triggers polling of the distance of the spy to the objective.
 *
 * @param {Element} dist_bar - used to represent the distance to the objective.
 * @param {Boundaries} boundaries - the boundaries of the game map.
 */
function received_boundaries(dist_bar, boundaries) {
    var game_width = boundaries.max_x - boundaries.min_x;
    var game_height = boundaries.max_y - boundaries.min_y;
    var max_dist = Math.hypot(game_width, game_height);

    var interval_time = 700; // ms, matching with the css

    function poll() {
        get('dist-to-objective', function(response) {
            var distance = JSON.parse(response)['distance'];
            console.log(distance);
            recieved_objective_distance(dist_bar, distance);
            setTimeout(poll, interval_time);
        });
    }

    poll();
}

/**
 * Called when the distance of the spy to the objective has been received.
 * This updates the indicator bar.
 *
 * @param {Element} dist_bar - used to represent the distance to the objective.
 * @param {number} distance - the game distance to the objective.
 */
function recieved_objective_distance(dist_bar, distance) {
    var prop = convert_dist_to_bar_proportion(distance, 400);
    dist_bar.style.width = `${prop}%`;
}

window.onload = function() {
    var dist_bar = document.querySelector('#distance_bar');
    get('boundaries', boundaries_json => received_boundaries(dist_bar, JSON.parse(boundaries_json)));
};
