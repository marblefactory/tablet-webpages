
window.onload = function() {
    // Setup the camera selector view, used to replace a camera feed.
    var camera_selector = new CameraSelectorView();
    camera_selector.hide();

    camera_selector.on_feed_pressed = function(i) {
        console.log("")
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
            // console.log(`Pressed camera ${i}`);
            //
            // // Which camera to replace with the new feed.
            // var obj = {
            //     replace_index: 0, // TODO
            //     new_camera_index: i
            // };
            //
            // post_obj('camera_chosen', obj);
        }
    }

    get_game_map_boundaries(got_game_map_boundaries);
}
