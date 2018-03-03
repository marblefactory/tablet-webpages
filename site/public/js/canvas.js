
/**
 * Creates the path for a circle, then uses operation to stroke, fill, etc
 * the circle.
 * @param {function} operation - performs stroking, filling, etc
 */
function _make_circle_path(ctx, x, y, radius, color, operation) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    operation()
}

/**
 * Draws a line around the described circle.
 */
function stroke_circle(ctx, x, y, radius, line_width, color) {
    _make_circle_path(ctx, x, y, radius, color, stroke);
    function stroke() {
        ctx.strokeStyle = color;
        ctx.lineWidth = line_width;
        ctx.stroke();
    }
}

/**
 * Draws a line around the described circle.
 */
function fill_circle(ctx, x, y, radius, color) {
    _make_circle_path(ctx, x, y, radius, color, fill);
    function fill() {
        ctx.fillStyle = color;
        ctx.fill();
    }
}

/**
 * Draws the operation with the given alpha, then resets the alpha after.
 * @param {function} operation - the drawing operation.
 */
function draw_with_alpha(ctx, alpha, operation) {
    var prev_alpha = ctx.globalAlpha;

    ctx.globalAlpha = alpha;
    operation();
    ctx.globalAlpha = prev_alpha;
}

/**
 * Moves the context to by the given translation, then moves it back after
 * the operation is complete.
 * @param {function} operation - the drawing operation.
 */
function draw_with_translation(ctx, dx, dy, operation) {
    ctx.translate(dx, dy);
    operation();
    ctx.translate(-dx, -dy);
}

/**
 * Rotates the canvas by the given translation, then moves it back after the
 * operation is complete.
 * @param {function} operation - the drawing operation.
 */
function draw_with_rotation(ctx, degrees, operation) {
    ctx.rotate(degrees);
    operation();
    ctx.rotate(-degrees);
}
