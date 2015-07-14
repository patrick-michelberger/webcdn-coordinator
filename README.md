# WebCDN Coordinator
Coordinator server for a browser-based content distribution network using WebRTC

## Installation
```bash
npm install webcdn-coordinator
```

## Quickstart

```bash
$ npm install webcdn-coordinator
$ cd webcdn-coordinator 
$ npm start
```

## API

### Server

Exposed by require('webcdn-coordinator').

### Server()

Creates a new `Server`. Works with and without `new`:

```js
var coordinator = require('webcdn-coordinator')();
// or
var Coordinator = require('webcdn-coordinator');
var coordinator = new Coordinator();
```
## Tests
To run the test suite, first install the dependencies, then run `npm test`.

```bash
$ npm install
$ npm test
```
