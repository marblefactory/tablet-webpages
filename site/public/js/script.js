
window.onload = function() {
    setup_camera_select();

    function got_game_map_boundaries(boundaries) {
        var canvas = document.getElementById('minimap');
        var minimap = new Minimap(canvas, boundaries);
        minimap.onload = function() {
            minimap.fullscreen();
            poll_positions(500, function(locations) {
                minimap.draw(locations.spy_loc,
                             locations.guard_locs,
                             locations.camera_locs,
                             locations.floor_num);
            });
        };
    }

    get_game_map_boundaries(got_game_map_boundaries);
}
