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
    this.settings = settings;
    this.dict_item_connections = {}; // (item_key, [listof connection]) pair
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
            // TODO
            console.log("lookup handler");
            break;
        case "connect":
            // TODO
            console.log("connect handler");
            break;
        default:
            throw new Error("Unsupported message command", command);
    }
};

/**
 * @api private
 */
Server.prototype.handleRelay = function(sender, receiver, data) {
    //console.log((new Date()) + ' Received relay message ' + data);
    this.sendMessage(receiver, data);

};

/**
 * @api private
 */
Server.prototype.handleUpdate = function(sender, items) {
    console.log((new Date()) + ' Received update message ' + items);
    this.addItems(sender, items);
};

/**
 * @api private
 */

Server.prototype.sendMessage = function(receiver, message) {
    this.messenger.send(receiver, message);
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

Server.prototype.addItems = function(connection, items) {
    var self = this;
    items.forEach(function(item) {
        self.addItem(connection, item);
    });
};
