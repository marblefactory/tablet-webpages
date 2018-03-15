
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

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
 * @param {number} max_dist - maximum distance from the spy to an objective.
 */
function received_max_dist(dist_bar, max_dist) {
    var interval_time = 700; // ms, matching with the css

    function poll() {
        get('dist-to-objective', function(response) {
            var distance = JSON.parse(response)['distance'];
            console.log(`DIST = ${distance}`);
            recieved_objective_distance(dist_bar, distance, max_dist);
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
function recieved_objective_distance(dist_bar, distance, max_dist) {
    var prop = convert_dist_to_bar_proportion(distance, max_dist);
    dist_bar.style.width = `${prop}%`;
}

window.onload = function() {
    var dist_bar = document.querySelector('#distance_bar');
    get('max-objective-dist', recieved);
    function recieved(response) {
        var max_dist = JSON.parse(response)['max_distance'];
        console.log(`MAX DIST = ${max_dist}`);
        received_max_dist(dist_bar, max_dist);
    }
};
