'use strict';

var WebSocketClient = require('websocket').client;
var chai = require('chai');
var expect = chai.expect;

describe('Coordinator', function() {
    it('it should a new user to all users', function(done) {
        var client1 = new WebSocketClient();
        client1.on('connect', function(connection) {

        });
    });
});
