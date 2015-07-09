/**
 * Module dependencies.
 */

/**
 * Expose `Server`.
 */

module.exports = Server;

/**
 * Initialize `Server` with the given `settings`,
 *
 * @param {Object} settings
 * @api private
 */
function Server(settings) {
    this.UPLOAD_RATIO = settings.upload_ratio;
    this.UPLOAD_MAX = settings.upload_max;
    this.settings = settings;
    this.dict_item_connections = {}; // {item_key: [list of connections]}
    this.dict_pid_connections = {};
    this.dict_pid_stats = {}; /// {item_key: {"upload" : 1234, "download": 12234}}
};

/**
 * @api private
 */
Server.prototype.setMessenger = function(messenger) {
    var self = this;
    this.messenger = messenger;
    messenger.on('message', function(sender, message) {
        self.onmessage.call(self, sender, message);
    });
    messenger.on('close', function(sender) {
        self.removePeer(sender.peerid);
    });
};

/**
 * @api private
 */
Server.prototype.onmessage = function(sender, message) {
    var cmd = null;
    if (message.type === 'utf8') {
        // process WebSocket message
        // console.log((new Date()) + ' Received Message ' + message.utf8Data);
        try {
            cmd = JSON.parse(message.utf8Data);
        } catch (e) {
            console.log("ERROR_JSON_MSG", message);
            return;
        }
    }
    this.handleCommand.call(this, sender, cmd);
};

/**
 * @api private
 */
Server.prototype.handleCommand = function(sender, command) {

    var type = command.type;
    var receiver = command.to;
    var data = command.data;

    switch (type) {
        case "relay":
            this.handleRelay(sender, receiver, data);
            break;
        case "update":
            this.handleUpdate(sender, data)
            break;
        case "lookup":
            this.handleLookup(sender, data);
            break;
        case "upload_ratio":
            this.handleUploadRatio(sender, data);
            break;
        default:
            throw new Error("Unsupported message command", command);
    }
};

/**
 * @api private
 */
Server.prototype.handleRelay = function(sender, receiver, data) {
    console.log((new Date()) + ' Received relay message ' + data);
    var msg = {
        "type": "relay",
        "to": receiver,
        "from": sender.peerid,
        "data": data
    };
    this.sendMessage(receiver, msg);
};

/**
 * @api private
 */
Server.prototype.handleUpdate = function(sender, items) {
    console.log((new Date()) + ' Received update message for items ' + items + ' from ' + sender.peerid);
    var pid = sender.peerid;
    this.addItems(pid, items);
};

/**
 * @api private
 */
Server.prototype.handleUploadRatio = function(sender, data) {
    console.log((new Date()) + ' Received upload_ratio message from ' + data.from + ' to ' + data.to);
    var pid = sender.peerid;
    // update uploader
    if (this.dict_pid_stats[data.from]) {
        this.dict_pid_stats[data.from].upload += data.size;
    } else {
        this.dict_pid_stats[data.from] = {
            "upload": data.size,
            "download": 0
        };
    }
    // update downloader
    if (this.dict_pid_stats[data.to]) {
        this.dict_pid_stats[data.to].download += data.size;
    } else {
        this.dict_pid_stats[data.to] = {
            "upload": 0,
            "download": data.size
        };
    }
};

/**
 * @api private
 */
Server.prototype.handleLookup = function(sender, objectHash) {
    console.log((new Date()) + ' Received lookup message for ' + objectHash + ' from ' + sender.peerid);
    var pid = this.getPeerByItem(sender.peerid, objectHash);
    var peerid = sender.peerid;
    var connection = this.dict_pid_connections[pid];
    var message = {};
    message.data = {
        peerid: pid || false,
        hash: objectHash
    };
    message.type = "lookup-response";
    this.sendMessage(peerid, message);
};

/**
 * @api private
 */

Server.prototype.sendMessage = function(peerid, message) {
    this.messenger.send(peerid, message);
};

/**
 * @api private
 */

Server.prototype.addItem = function(connection, item) {
    if (!connection)
        throw new Error('Connection object ERROR', item, connection);
    if (this.dict_item_connections[item]) {
        this.dict_item_connections[item].push(connection);
    } else {
        this.dict_item_connections[item] = [connection]
    }
};

/**
 * @api private
 */

Server.prototype.removeItem = function(item, connection) {
    if (!connection) { // Clean item for testing purpose
        delete this.dict_item_connections[item];
        return;
    }

    if (!connection)
        throw new Error('Connection object ERROR', item, connection);

    var list = [];
    var self = this;

    if (item in this.dict_item_connections) {
        list = self.dict_item_connections[item];
        var index = list.indexOf(connection);
        if (index >= 0) {
            list.splice(index, 1);
        }
        if (list.length == 0) {
            delete this.dict_item_connections[item];
        }
    }
};

/** 
 * @api private
 */

Server.prototype.addPeer = function(connection) {
    this.dict_pid_connections[connection.peerid] = connection;
};

/** 
 @api private
 */

Server.prototype.removePeer = function(peerid) {
    var self = this;
    var connection = self.dict_pid_connections[peerid];
    delete self.dict_pid_connections[peerid];
    delete self.dict_pid_stats[peerid];
    if (connection && connection.items.length > 0) {
        connection.items.forEach(function(item) {
            self.removeItem(item, connection);
        });
    }
};

/** 
 * @api private
 */
Server.prototype.getPeerByItem = function(requesterPeerId, objectHash) {
    // return pid to requesting item
    var list_connections = this.dict_item_connections[objectHash];
    var pid = '';
    if (list_connections && list_connections.length > 0) {
        // TODO 
        // If there are many other clients storing the
        // requested content, the coordinator attempts to select other
        // clients that the requesting client is already connected to, or
        // that are close to the requesting client (e.g., by using a geo-IP database).
        for (var i = 0; i < list_connections.length; i++) {
            var nc = list_connections[i];
            if (nc.peerid != requesterPeerId && this.isUploadAllowed(nc.peerid)) {
                pid = nc.peerid;
                break;
            }
        }
        return pid;
    }
};

/**
 * @api private
 */

Server.prototype.addItems = function(peerid, items) {
    var self = this;
    var connection = this.dict_pid_connections[peerid];
    if (!connection) {
        connection = new ConnectionWrapper();
        connection.peerid = peerid;
        connection.nc = connection;
        self.addPeer(connection);
    }
    items.forEach(function(item) {
        if (connection.items.indexOf(item) >= 0) return;
        self.addItem(connection, item);
        connection.items.push(item);
    });
};

Server.prototype.isUploadAllowed = function(peerId) {
    var stats = this.dict_pid_stats[peerId];
    var upload_ratio = getUploadRatio(stats);

    function getUploadRatio(stats) {
        if (stats && stats.download > 0) {
            return stats.upload / stats.download;
        } else {
            return 0;
        }
    };

    if (stats) {
        if (stats.upload <= this.UPLOAD_MAX && upload_ratio < this.UPLOAD_RATIO) {
            return true;
        } else {
            return false;
        }
    } else {
        return true;
    }
};

function ConnectionWrapper() {
    this.nc = null; // the actual connection object
    this.peerid = '' // e.g. "512e453bf35a8694d10b338d94afccc1895b123c4f60f1b18be38d11d3a68a49"
    this.items = [];
    this.sname = '';
};
