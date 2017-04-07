const assert = require('assert');
const Xev = require('../built').default;

describe('Core specs', () => {
	it('single listener', () => {
		const ev = new Xev();

		ev.sub('my-event', message => {
			assert.equal(message, 'strawberry pasta');
		});

		ev.pub('my-event', 'strawberry pasta');
	})
});
