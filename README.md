xev
================================================================

[![][npm-badge]][npm-link]
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
### Simple usage
``` javascript
import Xev from 'xev';

const ev = new Xev();

ev.sub('my-event', message => {
	console.log(`message received: ${message}`);
});

ev.pub('my-event', 'yo'); // <= 'message received: yo'
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
Technically, Node.js **cannot** workers to communicate directly
with each other - all communication goes via the master.
So, you must be call our `mount` initialize function.

### That is it.
Good luck, have fun.

API
----------------------------------------------------------------
### new Xev(namespace?)
If you are a library developer, we recommend setting namespace
to avoid conflicts with events of users or other libraries:
``` javascript
import Xev from 'xev';

const ev = new Xev('my-namespace');
```

### xev.mount()
If you want to share events on the cluster, please call this method once in the master process.

### xev.pub(type, data?)
Execute all callback functions that listen to the given `type`.

### xev.sub(type?, listener)
Listen to the given `type` and execute the `listener` each time an event is triggered.
``` javascript
// listen to single event
xev.sub('my-event', message => {
	// something
});

// listen all the events
xev.sub((event, message) => {
	// something
});
```

### xev.unsub(type?, listener)
Removes the given callback listening to the `type`.

License
----------------------------------------------------------------
[MIT](LICENSE)

[npm-link]:        https://www.npmjs.com/package/xev
[npm-badge]:       https://img.shields.io/npm/v/xev.svg?style=flat-square
[mit]:             http://opensource.org/licenses/MIT
[mit-badge]:       https://img.shields.io/badge/license-MIT-444444.svg?style=flat-square
