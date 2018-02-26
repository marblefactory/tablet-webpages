
function setup_camera_select() {
    var foreground = document.querySelector("#camera_select_foreground");

    // Add images for the 4 feeds to select.
    var static_images = [
        "https://media.giphy.com/media/M6hgceLnI2uJi/giphy.gif",
        "https://media.giphy.com/media/Yqn9tE2E00k4U/giphy.gif",
        "https://media.giphy.com/media/XuBNdP9Pb7W9i/giphy.gif",
        "https://media.giphy.com/media/ECeEafzJSLDoc/giphy.gif"
    ]

    for (var i=0; i<static_images.length; i++) {
        // A div to contain the feeds.
        var feed_div = document.createElement('div');
        feed_div.id = `feeds${i}`;
        feed_div.className = 'grid-item';
        foreground.append(feed_div);

        // An image of the camera static.
        var camera_static_div = document.createElement('div');
        camera_static_div.className = 'camera_static';
        camera_static_div.style.backgroundImage = `url(${static_images[i]})`;
        feed_div.append(camera_static_div);

        // A label indicating the name of the camera feed.
        var feed_label = document.createElement('h2');
        feed_label.className = 'feed_label';
        feed_label.innerHTML = `feed 0${i}`;
        feed_div.append(feed_label);

        // A button used to select the camera to replace.
        // var button = document.createElement('button');
    }
}
