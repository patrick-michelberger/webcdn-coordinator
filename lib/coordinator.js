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
        "items_peer": 20,
        "servers": 1,
        "port": 1935,
        "name": "s1",
        "host": "localhost",
        "config": [{
                name: 's1',
                host: 'localhost',
                port: 1337,
                path: "s1.sock"
            },
            /*{
                name: 's2',
                host: 'localhost',
                port: 9902,
                path: "s2.sock"
            }
            */
        ]
    };

    var server = new Server(settings);

    var messenger = new Messenger();
    messenger.loadConfig(settings.name, settings.config);

    server.setMessenger(messenger);
    return server;
}
