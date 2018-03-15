/**
 * Sends a GET requst to the server, with the given url_postfix added to the
 * end of the url of the server.
 */
function get(url_postfix, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            callback(request.responseText);
        }
    }

    url = window.location.origin + '/' + url_postfix;
    request.open("GET", url, true);
    request.send(null);
}

/**
 * Sends a post request to the server, with the given ulr_postfix added to the
 * end of the url of the server.
 */
function post_obj(url_postfix, obj, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200 && callback) {
            callback(request.responseText);
        }
    }

    url = window.location.origin + '/' + url_postfix;

    request.open("POST", url, true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(obj));
}
