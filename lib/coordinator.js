/**
 * Module dependencies.
 */

var Server = require('./server');
var Messenger = require('./messenger');

/**
 * Expose createServer().
 */
exports = module.exports = createServer;

/**
 * Create a webcdn coordinator server.
 *
 * @return {Function}
 * @api public
 */

function createServer(settings) {
    settings = settings || {};
    var upload_ratio = (typeof settings.uploadRatio === "number") ? settings.uploadRatio : 1;
    var upload_max = (typeof settings.uploadMax === "number") ? settings.uploadMax : 10;
    var socket_port = (typeof settings.socketPort === "number") ? settings.socketPort : 1337;

    var settings = {
        "upload_ratio": upload_ratio, // ensuring that no client has to upload more than the amount it has downloaded.
        "upload_max": upload_max, // total amount of content that any client is asked to upload per week (e.g 10 MB).
        "socket" : {
            "port": socket_port
        }
    };

    var server = new Server(settings);
    var messenger = new Messenger();

    messenger.loadConfig(settings.socket);
    server.setMessenger(messenger);
    return server;
}
