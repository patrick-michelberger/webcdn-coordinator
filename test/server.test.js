'use strict';

var expect = require('chai').expect;
var Coordinator = require('../lib/coordinator.js');
var Server = require('../lib/server.js');
var Messenger = require('../lib/messenger.js');
var WebSocketServer = require('websocket').server;
var W3CWebSocket = require('websocket').w3cwebsocket;

var sdpStringOffer = "v=0\\r\\n" + "o=- 5588049418976110637 2 IN IP4 127.0.0.1\\r\\n" + "s=-\\r\\n" + "t=0 0\\r\\n" + "a=msid-semantic: WMS\\r\\n" + "m=application 9 DTLS/SCTP 5000\\r\\n" + "c=IN IP4 0.0.0.0\\r\\n" + "a=ice-ufrag:MoO1h+9coSHA4GKu\\r\\n" + "a=ice-pwd:alaZDAtUh9wucNk+kJLx8pQp\\r\\n" + "a=fingerprint:sha-256 15:BB:EB:C9:CF:F6:D0:C9:20:3B:A7:E0:2A:A3:42:F5:29:A3:8B:56:E8:5A:04:16:BE:47:C4:CC:1D:FA:A7:7D\\r\\n" + "a=setup:actpass\\r\\n" + "a=mid:data\\r\\n" + "a=sctpmap:5000 webrtc-datachannel 1024\\r\\n";
var relayMessage = '{"type":"relay","to":"2","data":{"type":"offer","sdp":"' + sdpStringOffer + '"}}';
var updateMessage = '{"type":"update","data":["123456","125355"]}';
var lookupMessage = '{"type":"lookup","data":"123456"}';
var uploadRatioMessage = '{"type":"upload_ratio","data":{"from":"8538934b-df4d-4978-9e05-6e407729ec26","to":"57036898-fb4c-43d3-90aa-eaa91d66b088","hash":"db55def70d097084319386de7d3ac32188b6cf62","size":75510}}';

describe('Server', function() {

    var server = Coordinator();

    beforeEach(function() {
        server.messenger.clear();
    });

    afterEach(function() {
        server.dict_pid_stats = {};
        server.dict_item_connections = {};
        server.dict_pid_connections = {};
    });

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
                    expect(msg.data.type).to.equal('offer');
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
                }, 100);
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

    describe('.removePeer', function() {
        it("should delete the peer on a close event and its corresponding stored items", function(done) {
            var client = new W3CWebSocket('ws://localhost:1337?id=1');
            client.onopen = function() {
                client.send(updateMessage);
                setTimeout(function() {
                    client.close();
                    setTimeout(function() {
                        expect(server.dict_pid_connections['1']).to.be.empty;
                        expect(Object.keys(server.dict_item_connections).length).to.be.equal(0);
                        done();
                    }, 100);
                }, 100);
            };
        });

        it("should delete the corresponding statistics after removing a specific peer", function(done) {
            var client = new W3CWebSocket('ws://localhost:1337?id=57036898-fb4c-43d3-90aa-eaa91d66b088');
            client.onopen = function() {
                client.send(updateMessage);
                client.send(uploadRatioMessage);
                setTimeout(function() {
                    client.close();
                    setTimeout(function() {
                        expect(server.dict_pid_connections['57036898-fb4c-43d3-90aa-eaa91d66b088']).to.be.empty;
                        expect(server.dict_pid_stats['57036898-fb4c-43d3-90aa-eaa91d66b088']).to.be.empty;
                        expect(Object.keys(server.dict_item_connections).length).to.be.equal(0);
                        done();
                    }, 100);
                }, 100);
            };
        });
    });

    describe('.handleUploadRatio', function() {
        it("should update the clients upload statistics", function(done) {
            var client = new W3CWebSocket('ws://localhost:1337?id=57036898-fb4c-43d3-90aa-eaa91d66b088');
            client.onopen = function() {
                client.send(uploadRatioMessage);
                setTimeout(function() {
                    expect(server.dict_pid_stats["8538934b-df4d-4978-9e05-6e407729ec26"].upload).to.be.equal(75510);
                    expect(server.dict_pid_stats["8538934b-df4d-4978-9e05-6e407729ec26"].download).to.be.equal(0);
                    expect(server.dict_pid_stats["57036898-fb4c-43d3-90aa-eaa91d66b088"].download).to.be.equal(75510);
                    expect(server.dict_pid_stats["57036898-fb4c-43d3-90aa-eaa91d66b088"].upload).to.be.equal(0);
                    done();
                }, 10);
            };
        });
    });

});
