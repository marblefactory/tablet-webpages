
window.onload = function() {
    // Used to store the pressed camera index. This is then combined with the
    // feed pressed to tell which camera view to replace and the new camera view.
    var new_camera_index = -1;

    // Setup the camera selector view, used to replace a camera feed.
    var camera_selector = new CameraSelectorView();
    camera_selector.hide();

    camera_selector.on_feed_pressed = function(i) {
        console.log(`Replace feed ${i} with camera ${new_camera_index}`);

        // Which camera to replace with the new feed.
        var obj = {
            replace_index: i,
            new_camera_index: new_camera_index
        };

        post_obj('camera_chosen', obj);
    };

    // Setup the minimap.
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

        minimap.on_camera_pressed = function(i) {
            camera_selector.show();
            new_camera_index = i;
        }
    }

    get_game_map_boundaries(got_game_map_boundaries);
}
