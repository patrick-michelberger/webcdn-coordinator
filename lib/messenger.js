/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var WebSocketServer = require('websocket').server;
var http = require('http');


/**
 * Expose `Messenger`.
 */

module.exports = Messenger;

/**
 * Initialize `Messenger
 * @api private
 */
var Messenger = function() {
    this.sockets = [];
    this.name = '';

    this.sock_unix = null; // my listening socket
    this.sock_tcp = null;
};

/**
 * @api private
 */

Messenger.prototype.__proto__ = EventEmitter.prototype;

/**
 * @api private
 */

Messenger.prototype.loadConfig = function(name, config) {
    if (!name) throw new Error("Messenger name must be set.");
    //  var oldUmask = process.umask(0000);
    this.name = name;
    var self = this;
    for (var i = 0; i < config.length; i++) {
        var m = config[i];
        self.initSocket(m);
        /*
        if (m.name == name) { // config myself
            var onconnect = function(sock) {
                self.initSocket(sock);
                var buf = self.encodeMsg(self.name);
                self._send(sock, buf);
            };
            this.sock_unix = Net.createServer(onconnect);
            this.sock_tcp = Net.createServer(onconnect);
            this.sock_unix.listen(m.path);
            this.sock_tcp.listen(m.port);
            break;
        } else {
            this.connectServer(m);
        }
        */
    }
};

/**
 * @api private
 */

Messenger.prototype.connectServer = function(server) {};

/**
 * @api private
 */

Messenger.prototype.initSocket = function(sock) {
    if (sock) {
        var self = this;
        var server = http.createServer(function(request, response) {});
        server.listen(sock.port, function() {
            console.log((new Date()) + " server is listening on port " + sock.port);
        });
        var wsServer = new WebSocketServer({
            httpServer: server
        });
        // This callback function is called every time someone
        // tries to connect to the WebSocket server
        wsServer.on('request', function(request) {
            console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
            var connection = request.accept(null, request.origin);
            console.log(' Connection ' + connection.remoteAddress);

            self.sockets.push(connection);

            var peer_id = "";
            if (request.resourceURL && request.resourceURL.query && request.resourceURL.query.id) {
                peer_id = request.resourceURL.query.id;
                console.log("PeerID: " + peer_id);
            }

            connection.on('message', function(message) {
                self.onmessage(connection, message);
            });

            connection.on('close', function(reasonCode, description) {
                // close user connection
                console.log((new Date()) + " Peer disconnected.");
                var index = self.sockets.indexOf(connection);
                if (index >= 0) {
                    self.sockets.splice(index, 1);
                } else {
                    trace("Delete disconnected peer fail.");
                }
                self.onclose(connection, reasonCode, description);
            });

            connection.on("error", function(error) {
                self.onerror(connection, error);
            });

        });
    }
};

/**
 * @api private
 */

Messenger.prototype.onerror = function(sender, error) {
    this.emit("error", sender, error);
};

/**
 * @api private
 */

Messenger.prototype.onclose = function(sender, reasonCode, description) {
    this.emit("close", sender, reasonCode, description);
};

/**
 * @api private
 */

Messenger.prototype.ondata = function(sender, data) {};

/**
 * This is the most important callback for us, we'll handle all messages from users here.
 * // For Text Frames:
 * {
 *   type: "utf8",
 *   utf8Data: "A string containing the received message."
 * }
 * // For Binary Frames:
 * {
 *   type: "binary",
 *   binaryData: binaryDataBuffer // a Buffer object containing the binary message payload
 * }
 * @param {Object} message
 * @api private
 */

Messenger.prototype.onmessage = function(sender, message) {
    if (message.type === 'utf8') {
        // process WebSocket message
        this.emit("message", sender, message);
        //sender.emit("message", message);
        /*
        console.log((new Date()) + ' Received Message ' + message.utf8Data);
        // broadcast message to all connected clients
        clients.forEach(function(outputConnection) {
            if (outputConnection != connection) {
                outputConnection.send(message.utf8Data, sendCallback);
            }
        });
        */
    }
};

/**
 * @api private
 */

Messenger.prototype._readbuf = function(data, dataptr, buff, ptr) {};

/**
 * @api private
 */

Messenger.prototype._readmsg = function(sender, msg) {};

/**
 * @api private
 */

Messenger.prototype.encodeMsg = function(msg) {};

/**
 * @api private
 */

Messenger.prototype._send = function(sock, buf) {};

/**
 * @api private
 */

Messenger.prototype.broadcast = function(msg) {};

/**
 * @api private
 */

Messenger.prototype.send = function(name, msg) {};

module.exports = Messenger;
