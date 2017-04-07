xev
================================================================

[![][npm-badge]][npm-link]
[![][travis-badge]][travis-link]
[![][mit-badge]][mit]

Global event system for [Node](https://github.com/nodejs/node).
**It works well on the cluster!** (Messaging between master and workers)

Install
----------------------------------------------------------------
``` shell
$ npm install xev --save
```

Usage
----------------------------------------------------------------
It is the same as using [EventEmitter](https://nodejs.org/api/events.html).
**But all events are shared globally.**

### Simple usage
File A:
``` javascript
import Xev from 'xev';

const ev = new Xev();

ev.on('my-event', message => {
	console.log(`message received: ${message}`);
});
```

File B:
``` javascript
import Xev from 'xev';

const ev = new Xev();

ev.emit('my-event', 'yo'); // <= 'message received: yo'
```

### On the cluster
If you use the cluster, You must be call `mount` function at the master process. e.g.:
``` javascript
import { isMaster } from 'cluster';
import Xev from 'xev';

const ev = new Xev();

if (isMaster) {
	// your master code

	ev.mount(); // Init xev
} else {
	// your worker code
}
```

Worker A:
``` javascript
import Xev from 'xev';

const ev = new Xev();

ev.on('my-event', message => {
	console.log(`message received: ${message}`);
});
```

Worker B:
``` javascript
import Xev from 'xev';

const ev = new Xev();

ev.emit('my-event', 'yo'); // <= 'message received: yo'
```

Technically, Node.js **cannot** workers to communicate directly
with each other - all communication goes via the master.
So, you must be call our `mount` initialize function.

### That is it.
Good luck, have fun.

API
----------------------------------------------------------------
Please see [EventEmitter](https://nodejs.org/api/events.html).
In the following, we will describe the unique API of xev.

### new Xev(namespace?)
If you are a library developer, we recommend setting namespace
to avoid conflicts with events of users or other libraries:
``` javascript
import Xev from 'xev';

const ev = new Xev('my-namespace');
```

### xev.mount()
If you want to share events on the cluster, please call this method once in the master process.

License
----------------------------------------------------------------
[MIT](LICENSE)

[npm-link]:        https://www.npmjs.com/package/xev
[npm-badge]:       https://img.shields.io/npm/v/xev.svg?style=flat-square
[mit]:             http://opensource.org/licenses/MIT
[mit-badge]:       https://img.shields.io/badge/license-MIT-444444.svg?style=flat-square
[travis-link]:    https://travis-ci.org/syuilo/xev
[travis-badge]:   http://img.shields.io/travis/syuilo/xev.svg?style=flat-square
