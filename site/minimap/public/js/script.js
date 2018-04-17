
window.onload = function() {
    // Prevent right clicks.
    document.addEventListener('contextmenu', event => event.preventDefault());

    // Used to store the pressed camera index. This is then combined with the
    // feed pressed to tell which camera view to replace and the new camera view.
    var new_camera_game_id = -1;

    // Setup the model for the minimap.
    var camera_colors = ["#000", "#00dd1a", "#FF0", "#F00"];
    var model = new Model(camera_colors);

    var canvas = document.getElementById('minimap');
    var minimap = new Minimap(canvas, model);

    var floor_list = document.querySelector('#floor_list');
    var floor_selector = new FloorSelector(floor_list, model);

    // Setup the camera selector view, used to replace a camera feed.
    var camera_selector = new CameraSelectorView(camera_colors);
    camera_selector.hide();

    camera_selector.on_feed_pressed = function(feed_index) {
        var new_camera = model.game_cameras.find(cam => cam.id == new_camera_game_id);

        // Check that the feed of the new camera is not the same feed it is
        // replacing, i.e. has no effect.
        if (new_camera !== undefined && feed_index !== new_camera.feed_index) {
            // Which camera to replace with the new feed.
            var obj = {
                replace_feed_index: feed_index,
                new_camera_game_id: new_camera_game_id
            };

            // Once we know the camera feeds have been updated correctly, update
            // the indices so the camera colors are updated sooner than when
            // the next poll occurs.
            post_obj('camera_chosen', obj, function() {
                model.update_camera_feed_indices(new_camera_game_id, feed_index);
                minimap.refresh_positons();
            });
        }
    };

    // Load the minimap and model.
    minimap.load_images(minimap_loaded);

    function minimap_loaded() {
        model.onload = function() {
            floor_selector.setup_floor_list();
            minimap.run_loop();
        };

        model.poll_positions(1600, function() {
            // Update the selected floor in case the spy is being automatically
            // followed and changes floor.
            floor_selector.update();
            minimap.refresh_positons();
        });
    }

    // Open the camera selector if a camera is pressed.
    minimap.on_camera_pressed = function(camera_game_id) {
        camera_selector.show();
        new_camera_game_id = camera_game_id;
    }

    // Display the pressed floor.
    floor_selector.did_select_floor = function(floor_index) {
        model.set_selected_floor(floor_index);
        floor_selector.update();

        // Get the positions of all the objects on the requested floor.
        var floor_num_obj = {
            floor_num: floor_index
        };
        post_obj('floor_selected', floor_num_obj, function(response) {
            minimap.clear_markers();
            model.update_from_game_response(response);
            minimap.refresh_positons();
        });
    }
}
