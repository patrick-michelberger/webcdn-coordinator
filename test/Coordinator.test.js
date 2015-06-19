'use strict';

var expect = require('chai').expect;
var coordinator = require('../lib/coordinator.js');
var Server = require('../lib/server.js');

describe('Coordinator', function() {
    it('it should create a coordinator server instance', function(done) {
    	var server = coordinator();
    	expect(server).to.be.an.instanceof(Server);
    	done();
    });
});
