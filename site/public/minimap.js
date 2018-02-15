
function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Minimap(canvas) {
    this.ctx = canvas.getContext('2d');
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
    _draw_background: function(callback) {
        // var image = document.getElementById('map_background');
        var background = new Image();
        background.src = 'map.jpg';

        // Make sure the image is loaded first otherwise nothing will draw.
        var _this = this;
        background.onload = function() {
            _this.ctx.drawImage(background, 0, 0, _this.width(), _this.height());
            callback();
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
     * Draws the minimap with the position of the spy.
     * @param {Point} spy_pos - the position of the spy.
     */
    draw: function(spy_pos) {
        var _this = this;
        this._draw_background(function() {
            _this._draw_spy(spy_pos);
        });
    }
};

window.onload = function() {
    var canvas = document.getElementById('minimap');
    var minimap = new Minimap(canvas);
    minimap.fullscreen();
    minimap.draw(new Point(100, 200));
}
