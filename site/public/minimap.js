
function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Minimap(canvas) {
    this.ctx = canvas.getContext('2d');
    this.floor_names = ['Basement', 'Floor 1', 'Roof'];
    this.floor_label_elem = document.querySelector('#floor');
}

Minimap.prototype = {
    width: function() {
        return this.ctx.canvas.width;
    },

    height: function() {
        return this.ctx.canvas.height;
    },

    marker_radius: function() {
        return this.width() * 0.015;
    },

    /**
     * Resizes the canvas to fit to fullscreen.
     */
    fullscreen: function() {
        this.ctx.canvas.width = window.innerWidth;
        this.ctx.canvas.height = window.innerHeight;
    },

    /**
     * Draws the background map.
     */
    draw_background: function(floor_num, callback) {
        if (floor_num < 0 || floor_num > 2) {
            throw 'incorrect floor num: ' + floor_num
        }

        this.floor_label_elem.innerHTML = this.floor_names[floor_num];

        var background = new Image();
        background.src = 'floor_maps/floor' + floor_num + '.jpg';

        // Make sure the image is loaded first otherwise nothing will draw.
        var _this = this;
        background.onload = function() {
            _this.ctx.drawImage(background, 0, 0, _this.width(), _this.height());
            if (callback) {
                callback();
            }
        }
    },

    /**
     * Draws a marker for a guard, spy, etc with a center at the given position.
     */
    _draw_marker: function(x, y, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.marker_radius(), 0, 2 * Math.PI, false);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    },

    /**
     * Draws a marker for the location of the spy on the map.
     * @param {Point} pos - the position to draw the spy.
     */
    _draw_spy: function(pos) {
        this._draw_marker(pos.x, pos.y, 'black');
    },

    /**
     * Draws markers for the location of the guards on the map.
     * @param {[Point]} points - the positions to draw the guards at.
     */
    _draw_guards: function(points) {
        for (var i=0; i<points.length; i++) {
            this._draw_marker(points[i].x, points[i].y, 'red');
        }
    },

    /**
     * Draws the minimap with the position of the spy.
     * @param {Point} spy_loc - the position of the spy.
     * @param {[Point]} guard_locs - the locations of the guards that can be seen.
     */
    draw: function(spy_loc, guard_locs, floor_num) {
        var _this = this;
        this.draw_background(floor_num, function() {
            _this._draw_guards(guard_locs);
            _this._draw_spy(spy_loc);
        });
    }
};

var HttpClient = function() {
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() {
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                aCallback(anHttpRequest.responseText);
        }

        anHttpRequest.open("GET", aUrl, true);
        anHttpRequest.send(null);
    }
}

/**
 * Polls the spy and guards position interval_time after the last position
 * was received.
 */
function poll_positions(interval_time, callback) {
    var client = new HttpClient();
    client.get(window.location.origin + '/positions', function(response) {
        var locations = JSON.parse(response);
        callback(locations);
        setTimeout(function() {
            poll_positions(interval_time, callback)
        }, interval_time);
    });
}

window.onload = function() {
    var canvas = document.getElementById('minimap');
    var minimap = new Minimap(canvas);
    minimap.fullscreen();
    minimap.draw_background();

    poll_positions(500, function(locations) {
        minimap.draw(locations.spy_loc, locations.guard_locs, locations.floor_num);
    });
}
