'use strict';

var expect = require('chai').expect;
var Messenger = require('../lib/messenger.js');
var WebSocketServer = require('websocket').server;

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
    }]
};

describe('Messenger', function() {
    it('it should create a messenger instance', function(done) {
        var messenger = new Messenger();
        expect(messenger).to.be.an.instanceof(Messenger);
        done();
    });

    describe('.loadConfig', function() {
        it('it should create a websocket server', function(done) {
            var messenger = new Messenger();
            messenger.loadConfig(settings.name, settings.config);
            expect(messenger.wsServer).to.be.an.instanceof(WebSocketServer);
            done();
        });
    });
});
