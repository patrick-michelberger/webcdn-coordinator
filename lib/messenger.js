/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var WebSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');
var url = require('url');
var geoip = require('geoip-lite');

/**
 * Expose `Messenger`.
 */

module.exports = Messenger;

/**
 * Initialize `Messenger
 * @api private
 */
var Messenger = function() {
    this.sockets = {};
};

/**
 * @api private
 */

Messenger.prototype.__proto__ = EventEmitter.prototype;

/**
 * @api private
 */

Messenger.prototype.loadConfig = function(name, config) {
    for (var i = 0; i < config.length; i++) {
        var socketConfig = config[i];
        this.initSocket(socketConfig);
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

        // HTTP Server
        var server = http.createServer(function(request, response) {
            var pathname = url.parse(request.url).pathname;
            var file = "index.html";

            console.log("pathname: ", pathname);
            if (pathname === '/examples' || pathname === '/example') {
                file = "example.html";
            }

            var readStream = fs.createReadStream(file);
            readStream.on('open', function() {
                readStream.pipe(response);
            });
            readStream.on('error', function(err) {
                response.end(err);
            });
        });
        server.listen(sock.port, function() {
            console.log((new Date()) + " server is listening on port " + sock.port);
        });

        // Websocket Server
        var wsServer = new WebSocketServer({
            httpServer: server
        });

        self.wsServer = wsServer;

        // This callback function is called every time someone tries to connect to the WebSocket server
        wsServer.on('request', function(request) {
            console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
            var connection = request.accept(null, request.origin);
            var peer_id = "";
            var position = {
                "type": "geolocation"
            };

            if (request.resourceURL && request.resourceURL.query) {
                // parse query information

                if (request.resourceURL.query.id) {
                    // peer ID received
                    peer_id = request.resourceURL.query.id;
                    connection.peerid = peer_id;

                    if (request.resourceURL.query.lat && request.resourceURL.query.lon) {
                        // peer geolocation received
                        position.data = {
                            "latitude": Number(request.resourceURL.query.lat),
                            "longitude": Number(request.resourceURL.query.lon)
                        };
                    } else {
                        var ip = "84.171.101.75";
                        var geo = geoip.lookup(request.remoteAddress);
                        var latitude = 48.6616037;
                        var longitude = 9.3501336;
                        if (geo) {
                            latitude = geo.ll[0];
                            longitude = geo.ll[1];
                        }
                        position.data = {
                            "latitude": latitude,
                            "longitude": longitude
                        };

                    }
                    // save peer's gelocation
                    self.onmessage(connection, position);
                }
            }


            self.sockets[peer_id] = connection;

            connection.on('message', function(message) {
                self.onmessage(connection, message);
            });

            connection.on('close', function(reasonCode, description) {
                // close user connection
                console.log((new Date()) + " Peer disconnected.");
                var connectionDeleted = false;
                for (var key in self.sockets) {
                    if (self.sockets[key] === connection) {
                        delete self.sockets[key];
                        connectionDeleted = true;
                    }
                }
                if (!connectionDeleted) {
                    console.log("Delete disconnected peer fail");
                }
                console.log("connected peers: ", Object.keys(self.sockets).length);
                self.onclose(connection, reasonCode, description);
            });

            connection.on("error", function(error) {
                console.log("connection.error: ", error);
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
 * @api private
 */

Messenger.prototype.onmessage = function(sender, message) {
    this.emit("message", sender, message);
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

Messenger.prototype.send = function(peerid, msg) {
    var sock = this.sockets[peerid];
    if (sock) {
        sock.send(JSON.stringify(msg));
    }
};

Messenger.prototype.clear = function() {
    for (var key in this.sockets) {
        delete this.sockets[key];
    }
};

module.exports = Messenger;
