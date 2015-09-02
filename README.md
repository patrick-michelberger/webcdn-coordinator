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
$ npm start [-- <args>]
```

| Options        | Type          | Default     |
| -------------- |:-------------:| -----------:|
| `uploadRatio`  | Number        | 1           |
| `uploadMax`    | Number        | 10 (MB)     |
| `socketPort`   | Number        | 1337        |

## API

### Server

Exposed by require('webcdn-coordinator').

### Server()

Creates a new `Server`.

```js
var coordinator = require('webcdn-coordinator')();
```

## Tests
To run the test suite, first install the dependencies, then run `npm test`.

```bash
$ npm install
$ npm test
```
