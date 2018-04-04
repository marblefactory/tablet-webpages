// Run a node.js web server for local development of a static web site.
// Start with "node server.js" and put pages in a "public" sub-folder.
// Visit the site at the address printed on the console.

// The server is configured to be platform independent.  URLs are made lower
// case, so the server is case insensitive even on Linux, and paths containing
// upper case letters are banned so that the file system is treated as case
// sensitive even on Windows.  All .html files are delivered as
// application/xhtml+xml for instant feedback on XHTML errors.  To improve the
// server, either add content negotiation (so old browsers can be tested) or
// switch to text/html and do validity checking another way (e.g. with vnu.jar).

// Choose a port, e.g. change the port to the default 80, if there are no
// privilege issues and port number 80 isn't already in use. Choose verbose to
// list banned files (with upper case letters) on startup.

var port = 8080;
var verbose = true;

// Load the library modules, and define the global constants.
// See http://en.wikipedia.org/wiki/List_of_HTTP_status_codes.
// Start the server:

var http = require("http");
var fs = require("fs");
var OK = 200, NotFound = 404, BadType = 415, Error = 500;
var types, banned;
start();

// Start the http service. Accept only requests from localhost, for security.
function start() {
    if (! checkSite()) return;
    types = defineTypes();
    banned = [];
    banUpperCase("./public/", "");
    var service = http.createServer(handle);
    service.listen(port, "localhost");
    var address = "http://localhost";
    if (port != 80) address = address + ":" + port;
    console.log("Server running at", address);
}

// Check that the site folder and index page exist.
function checkSite() {
    var path = "./public";
    var ok = fs.existsSync(path);
    if (ok) {
        path = "./public/index.html";
    }
    if (ok) {
        ok = fs.existsSync(path);
    }
    if (! ok) {
        console.log("Can't find", path);
    }
    return ok;
}

var spy_floor_num = 1; // Index of the floor the spy is on.
var g_selected_floor_num = -1; // -1 indicates to follow the spy.

var cameras = [
    { loc: { x: 200, y: 150 }, feed_index: null, max_visibility_dist: 30, id: 10 },
    { loc: { x: 50,  y: 60 },  feed_index: null, max_visibility_dist: 30, id: 11 },
    { loc: { x: 260, y: 240 }, feed_index: 0, max_visibility_dist: 30, id: 12 },
    { loc: { x: 20,   y: 300 },   feed_index: null, max_visibility_dist: 30, id: 13 },
    { loc: { x: 20,   y: 20 },   feed_index: 1, max_visibility_dist: 30, id: 14 },
    { loc: { x: 20,   y: 350 },   feed_index: 2, max_visibility_dist: 30, id: 15 },
    { loc: { x: 350,  y: 350 },   feed_index: 3, max_visibility_dist: 30, id: 16 }
];

/**
 * Sends the client the position of the spy, guards, cameras, and the floor number.
 */
function handle_get_spy_position(response) {
    var spy_loc = {
        x: Math.random() * 300 + 20, // The position, in game coordinates, of the spy.
        y: Math.random() * 300 + 20, // The position, in game coordinates, of the spy.
    };

    var guards_locs = [];

    for (var i=0; i<Math.floor(Math.random() * 100) + 30; i++) {
        guard_loc = {
            x: Math.random() * 300 + 20,
            y: Math.random() * 300 + 20
        };
        guards_locs.push(guard_loc);
    }

    var view_floor_num = g_selected_floor_num == -1 ? spy_floor_num : g_selected_floor_num;

    var locations = {
        spy_dir_rad: 3.14, // The angle the spy is facing, measured from horizontal.
        spy_loc: spy_loc,
        guards_locs: guards_locs,
        cameras: cameras,
        floor_num: view_floor_num
    }

    deliver(response, 'application/json', undefined, JSON.stringify(locations));
}

/**
 * Sends the client the boundaries of the game space.
 */
function handle_get_boundaries(request, response) {
    var boundaries = {
        min_x: 20,
        min_y: 20,
        max_x: 350,
        max_y: 350
    };

    deliver(response, 'application/json', undefined, JSON.stringify(boundaries));
}

/**
 * Recieves the index of the camera, in the list of cameras sent using
 * `handle_get_spy_position`, that the user selected.
 */
function handle_posted_camera_chosen(request, response) {
    var body = "";
    request.on('data', function (chunk) {
        body += chunk;
    });
    request.on('end', function () {
        var json = JSON.parse(body);
        console.log(`Replaced feed ${json.replace_feed_index} with game camera ${json.new_camera_game_id}`);

        // Find the index of the camera to be updated.
        var new_camera_idx = cameras.findIndex(cam => cam.id == json.new_camera_game_id);
        var old_camera_idx = cameras.findIndex(cam => cam.feed_index == json.replace_feed_index);

        // If there isn't a camera already with that feed, simply set the
        // feed of the new camera.
        if (old_camera_idx == -1) {
            cameras[new_camera_idx].feed_index = json.replace_feed_index;
        } else {
            cameras[new_camera_idx].feed_index = cameras[old_camera_idx].feed_index;
            cameras[old_camera_idx].feed_index = null;
        }
    });

    // TODO: Send the response correctly.
    var x = {};
    deliver(response, 'application/json', undefined, JSON.stringify(x));
}

/**
 * Receives a request to send the distance from the spy to the next objective.
 * This is used to indicate how far away the spy is from the objective.
 */
function handle_distance_to_objective(request, response) {
    var json = {
        distance: Math.random() * 320
    }

    deliver(response, 'application/json', undefined, JSON.stringify(json));
}

/**
 * Receives a request to update the selected floor, and sends back the positions
 * of the game objects in the same format as the '/positions' handler.
 */
function handle_floor_selected(request, response) {
    var body = "";
    request.on('data', function (chunk) {
        body += chunk;
    });
    request.on('end', function () {
        var json = JSON.parse(body);

        // Update the global selected floor.
        g_selected_floor_num = json.floor_num;
        handle_get_spy_position(response);
    });
}

// Serve a request by delivering a file.
function handle(request, response) {
    var url = request.url.toLowerCase();

    if (url == '/positions') {
        handle_get_spy_position(response);
    }
    else if (url == '/boundaries') {
        handle_get_boundaries(request, response);
    }
    else if (url == '/camera_chosen') {
        handle_posted_camera_chosen(request, response);
    }
    else if (url == '/dist_to_objective') {
        handle_distance_to_objective(request, response);
    }
    else if (url == '/floor_selected') {
        handle_floor_selected(request, response);
    }
    else {
        if (url.endsWith("/")) url = url + "index.html";
        if (isBanned(url)) return fail(response, NotFound, "URL has been banned");
        var type = findType(url);
        if (type == null) return fail(response, BadType, "File type unsupported");
        var file = "./public" + url;
        fs.readFile(file, ready);
        function ready(err, content) { deliver(response, type, err, content); }
    }
}

// Forbid any resources which shouldn't be delivered to the browser.
function isBanned(url) {
    for (var i=0; i<banned.length; i++) {
        var b = banned[i];
        if (url.startsWith(b)) return true;
    }
    return false;
}

// Find the content type to respond with, or undefined.
function findType(url) {
    var dot = url.lastIndexOf(".");
    var extension = url.substring(dot + 1);
    return types[extension];
}

// Deliver the file that has been read in to the browser.
function deliver(response, type, err, content) {
    if (err) return fail(response, NotFound, "File not found");

    if (type === 'image/png' || type === 'image/svg+xml') {
        var textTypeHeader = { "Content-Type": "text/plain" };
        response.writeHead(OK, textTypeHeader);
        var base64Encoded = content.toString('base64');
        response.write(base64Encoded, "utf8");
        //console.log(base64Encoded);
        //response.write("iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg", "utf8");
        response.end();
    }
    else {
        var typeHeader = { "Content-Type": type };
        response.writeHead(OK, typeHeader);
        response.write(content);
        response.end();
    }
}

// Give a minimal failure response to the browser
function fail(response, code, text) {
    var textTypeHeader = { "Content-Type": "text/plain" };
    response.writeHead(code, textTypeHeader);
    response.write(text, "utf8");
    response.end();
}

// Check a folder for files/subfolders with non-lowercase names.  Add them to
// the banned list so they don't get delivered, making the site case sensitive,
// so that it can be moved from Windows to Linux, for example. Synchronous I/O
// is used because this function is only called during startup.  This avoids
// expensive file system operations during normal execution.  A file with a
// non-lowercase name added while the server is running will get delivered, but
// it will be detected and banned when the server is next restarted.
function banUpperCase(root, folder) {
    var folderBit = 1 << 14;
    var names = fs.readdirSync(root + folder);
    for (var i=0; i<names.length; i++) {
        var name = names[i];
        var file = folder + "/" + name;
        if (name != name.toLowerCase()) {
            if (verbose) console.log("Banned:", file);
            banned.push(file.toLowerCase());
        }
        var mode = fs.statSync(root + file).mode;
        if ((mode & folderBit) == 0) continue;
        banUpperCase(root, file);
    }
}

// The most common standard file extensions are supported, and html is
// delivered as "application/xhtml+xml".  Some common non-standard file
// extensions are explicitly excluded.  This table is defined using a function
// rather than just a global variable, because otherwise the table would have
// to appear before calling start().  NOTE: add entries as needed or, for a more
// complete list, install the mime module and adapt the list it provides.
function defineTypes() {
    var types = {
        html : "application/xhtml+xml",
        css  : "text/css",
        js   : "application/javascript",
        mjs  : "application/javascript", // for ES6 modules
        png  : "image/png",
        gif  : "image/gif",    // for images copied unchanged
        jpeg : "image/jpeg",   // for images copied unchanged
        jpg  : "image/jpeg",   // for images copied unchanged
        svg  : "image/svg+xml",
        json : "application/json",
        pdf  : "application/pdf",
        txt  : "text/plain",
        ttf  : "application/x-font-ttf",
        woff : "application/font-woff",
        aac  : "audio/aac",
        mp3  : "audio/mpeg",
        mp4  : "video/mp4",
        webm : "video/webm",
        ico  : "image/x-icon", // just for favicon.ico
        xhtml: undefined,      // non-standard, use .html
        htm  : undefined,      // non-standard, use .html
        rar  : undefined,      // non-standard, platform dependent, use .zip
        doc  : undefined,      // non-standard, platform dependent, use .pdf
        docx : undefined,      // non-standard, platform dependent, use .pdf
    }
    return types;
}
