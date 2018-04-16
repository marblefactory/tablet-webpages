
/**
 * Loads the images with the given image names and calls the callback once they
 * are all loaded. The callback is given a list of loaded images.
 */
function preload(image_names, callback) {
    _preload([], image_names, callback);

    function _preload(images, image_names, complete) {
        if (image_names.length == 0) {
            complete(images);
            return;
        }

        var name = image_names.pop();
        var image = new Image();

        get(name, receivedBase64Image);
        function receivedBase64Image(contentBase64) {
            var src = `data:image/png;base64, ${contentBase64}`;
            image.src = src;

            _preload(images, image_names, complete);
        }

        images.push(image);
    }
}
