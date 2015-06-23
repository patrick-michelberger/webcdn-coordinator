'use strict';

var expect = require('chai').expect;
var Server = require('../lib/server.js');
var Messenger = require('../lib/messenger.js');
var WebSocketServer = require('websocket').server;
var W3CWebSocket = require('websocket').w3cwebsocket;

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

var sdpStringOffer = "v=0\\r\\n" + "o=- 5588049418976110637 2 IN IP4 127.0.0.1\\r\\n" + "s=-\\r\\n" + "t=0 0\\r\\n" + "a=msid-semantic: WMS\\r\\n" + "m=application 9 DTLS/SCTP 5000\\r\\n" + "c=IN IP4 0.0.0.0\\r\\n" + "a=ice-ufrag:MoO1h+9coSHA4GKu\\r\\n" + "a=ice-pwd:alaZDAtUh9wucNk+kJLx8pQp\\r\\n" + "a=fingerprint:sha-256 15:BB:EB:C9:CF:F6:D0:C9:20:3B:A7:E0:2A:A3:42:F5:29:A3:8B:56:E8:5A:04:16:BE:47:C4:CC:1D:FA:A7:7D\\r\\n" + "a=setup:actpass\\r\\n" + "a=mid:data\\r\\n" + "a=sctpmap:5000 webrtc-datachannel 1024\\r\\n";
var relayMessage = '{"type":"relay","to":"2","data":{"type":"offer","sdp":"' + sdpStringOffer + '"}}';
var updateMessage = '{"type":"update","data":["123456","125355"]}';
var lookupMessage = '{"type":"lookup","data":"123456"}';

describe('Server', function() {

    var messenger = new Messenger();
    var server = new Server();
    messenger.loadConfig(settings.name, settings.config);
    server.setMessenger(messenger);

    beforeEach(function() {
        messenger.clear();
    });

    afterEach(function() {});

    it('it should create a server instance', function(done) {
        expect(server).to.be.an.instanceof(Server);
        done();
    });

    describe('.setMessenger', function() {
        it('it should set a messenger instance', function(done) {
            expect(server.messenger).to.be.an.instanceof(Messenger);
            done();
        });
    });

    describe('.handleRelay', function() {
        it("it should forward a relay message", function(done) {
            var client1 = new W3CWebSocket('ws://localhost:1337?id=1');
            var client2 = new W3CWebSocket('ws://localhost:1337?id=2');

            client1.onopen = function() {
                client1.send(relayMessage);
            };

            client1.onmessage = function(e) {
                console.log("e.data: ", e.data);
            };

            client2.onmessage = function(e) {
                if (typeof e.data === 'string') {
                    var msg = JSON.parse(e.data);
                    expect(msg.type).to.equal('offer');
                    done();
                }
            };
        });
    });

    describe('.handleUpdate', function() {
        it("it should save the list of content-hashes for the sending peer", function(done) {
            var client = new W3CWebSocket('ws://localhost:1337?id=1');
            client.onopen = function() {
                client.send(updateMessage);
                setTimeout(function() {
                    expect(server.dict_item_connections["123456"]).not.to.be.empty;
                    done();
                }, 10);

            };
        });
    });

    describe('.handleLookup', function() {
        it("it should find a corresponding peer for a lookup request", function(done) {
            var client1 = new W3CWebSocket('ws://localhost:1337?id=1');

            var client2 = new W3CWebSocket('ws://localhost:1337?id=2');
            client1.onopen = function() {
                client1.send(updateMessage);
                setTimeout(function() {
                    client2.send(lookupMessage);
                }, 10);
            };

            client2.onmessage = function(e) {
                if (typeof e.data === 'string') {
                    var msg = JSON.parse(e.data);
                    expect(msg.type).to.equal('lookup-response');
                    done();
                }
            };
        });
    });

});
