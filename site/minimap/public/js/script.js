
window.onload = function() {
    // Used to store the pressed camera index. This is then combined with the
    // feed pressed to tell which camera view to replace and the new camera view.
    var new_camera_index = -1;

    // Setup the camera selector view, used to replace a camera feed.
    var camera_colors = ["red", "green", "blue", "orange"];
    var camera_selector = new CameraSelectorView(camera_colors);
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

    // Setup the model for the minimap.
    var model = new Model(camera_colors);

    // Setup the minimap.
    var canvas = document.getElementById('minimap');
    var minimap = new Minimap(canvas, model);

    minimap.load_images(minimap_loaded);

    function minimap_loaded() {
        model.onload = function() {
            minimap.run_loop();
        };

        // Start the model getting the positions.
        // model.poll_positions(800, function() {
        //     minimap.refresh_positons();
        // });

        model.poll_positions(1600, function() {
            minimap.refresh_positons();
        });
    }

    // Open the camera selector if a camera is pressed.
    minimap.on_camera_pressed = function(i) {
        camera_selector.show();
        new_camera_index = i;
    }
}
