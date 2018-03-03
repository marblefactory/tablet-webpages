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

var floor_num = 0;

/**
 * Sends the client the position of the spy, guards, cameras, and the floor number.
 */
function handle_get_spy_position(request, response) {
    var spy_loc = {
        x: Math.random() * 300 + 20, // The position, in game coordinates, of the spy.
        y: Math.random() * 300 + 20, // The position, in game coordinates, of the spy.
        dir: Math.random() % 360     // The angle the spy is facing.
    };

    var guard_locs = [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
        { x: 175, y: 175 }
    ];

    var cameras = [
        { loc: { x: 200, y: 150 }, is_active: true },
        { loc: { x: 50,  y: 60 },  is_active: true },
        { loc: { x: 260, y: 240 }, is_active: false },
    ];

    var locations = {
        spy_loc: spy_loc,
        guard_locs: guard_locs,
        cameras: cameras,
        floor_num: (floor_num) % 3
        // floor_num: (floor_num++) % 3
    }

    deliver(response, 'application/json', undefined, JSON.stringify(locations));
}

/**
 * Sends the client the boundaries of the game space.
 */
function handle_get_boundaries(request, response) {
    var boundaries = {
        min_x: 0,
        min_y: 0,
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
    //console.log('User selected camera: ' + request.body.camera_index);
    var body = "";
    request.on('data', function (chunk) {
        body += chunk;
    });
    request.on('end', function () {
        var json = JSON.parse(body);
        console.log(`Replaced camera ${json.replace_index} with ${json.new_camera_index}`);
    });

    // TODO: Send the response correctly.
    var x = {};
    deliver(response, 'application/json', undefined, JSON.stringify(x));
}

// Serve a request by delivering a file.
function handle(request, response) {
    var url = request.url.toLowerCase();

    if (url == '/positions') {
        handle_get_spy_position(request, response);
    }
    else if (url == '/boundaries') {
        handle_get_boundaries(request, response);
    }
    else if (url == '/camera_chosen') {
        handle_posted_camera_chosen(request, response);
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
    var typeHeader = { "Content-Type": type };
    response.writeHead(OK, typeHeader);
    response.write(content);
    response.end();
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
