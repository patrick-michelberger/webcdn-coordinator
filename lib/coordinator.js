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

function createServer() {
    var settings = {
        "upload_ratio": 1, // ensuring that no client has to upload more than the amount it has downloaded.
        "upload_max": 10, // total amount of content that any client is asked to upload per week (e.g 10 MB).
        "config": [{
            name: 's1',
            host: 'localhost',
            port: 1337,
            path: "s1.sock"
        }]
    };

    var server = new Server(settings);
    var messenger = new Messenger();

    messenger.loadConfig(settings.name, settings.config);
    server.setMessenger(messenger);
    return server;
}
