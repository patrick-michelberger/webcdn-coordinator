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
};

/**
 * @api private
 */
Server.prototype.setMessenger = function(messenger) {
    this.messenger = messenger;
    messenger.on('message', this.onmessage);
};

/**
 * @api private
 */
Server.prototype.onmessage = function(sender, msg) {
    console.log("onmessage: ", msg);
};
