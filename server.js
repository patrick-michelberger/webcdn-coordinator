var Messenger = require('./messenger.js');

/**
 * WebCDN Coordinator: 
 * serves as a directory for finding other clients storing content and protocol server (signaling) for WebRTC
 * @constructor
 * @param {Object} config - configuration object, should have at least  {items_peer: settings.items_peer}
 */

function Coordinator(config) {
    var self = this;

    self.setMessenger = function(messenger) {
        self.messenger = messenger;
        messenger.on('message', self.onmessage);
    };

    self.onmessage = function(sender, msg) {
        console.log("onmessage: ", msg);
    };
};

function main() {

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

    var coordinator = new Coordinator(settings);

    var messenger = new Messenger();
    messenger.loadConfig(settings.name, settings.config);

    coordinator.setMessenger(messenger);

};

main();

/*
var WebSocketServer = require('websocket').server;
var http = require('http');
var clients = [];

var server = http.createServer(function(request, response) {});

server.listen(1337, function() {
    console.log((new Date()) + " server is listening on port 1337");
});

var wsServer = new WebSocketServer({
    httpServer: server
});

function sendCallback(err) {
    if (err) console.error("send() error: " + err);
}

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    var connection = request.accept(null, request.origin);
    console.log(' Connection ' + connection.remoteAddress);

    clients.push(connection);

    var peer_id = "";
    if (request.resourceURL && request.resourceURL.query && request.resourceURL.query.id) {
        peer_id = request.resourceURL.query.id;
        console.log("PeerID: " + peer_id);
    }

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            // process WebSocket message
            console.log((new Date()) + ' Received Message ' + message.utf8Data);
            // broadcast message to all connected clients
            clients.forEach(function(outputConnection) {
                if (outputConnection != connection) {
                    outputConnection.send(message.utf8Data, sendCallback);
                }
            });
        }
    });

    connection.on('close', function(evt) {
        // close user connection
        console.log((new Date()) + " Peer disconnected.");
        var index = clients.indexOf(connection);
        if (index >= 0)
            clients.splice(index, 1);
        else
            trace("Delete disconnected peer fail.");
    });
});
*/
