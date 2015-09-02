var argv = require('minimist')(process.argv.slice(2));
require('./lib/coordinator')(argv);