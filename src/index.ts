/*!
 * xev
 * Copyright (c) 2017 syuilo
 * MIT Licensed
 */

import * as cluster from 'cluster';

/**
 * Global Event Emitter
 */
export default class Xev {
	/**
	 * Namespace
	 */
	public namespace: string;

	/**
	 * Init event emitter
	 * @param namespace? Namespace
	 */
	constructor(namespace?: string) {
		this.namespace = namespace;
	}

	/**
	 * Mount event system
	 * This method must be called in the master process.
	 */
	public mount(): void {
		if (cluster.isWorker) {
			throw 'Do not call this method in a worker process.';
		}

		// When receiving a message from workers
		cluster.on('message', (_, message) => broadcast(message));
		// When receiving a message from the master
		process.on('message', broadcast);

		function broadcast(message) {
			// Ignore third party messages
			if (message.namespace != this.namespace) return;

			// Broadcast the message to all workers
			for (const id in cluster.workers) {
				const worker = cluster.workers[id];
				worker.send(message);
			}
		}
	}

	/**
	 * Publish event
	 * @param type Event name
	 * @param data Event data
	 */
	public pub(type: string, data: any): void {
		const message = { type, data, namespace: this.namespace };

		if (cluster.isMaster) {
			process.emit('message', message);
		} else {
			process.send(message);
		}
	}

	/**
	 * Subscribe event
	 * @param type Event name
	 * @param handler Event handler
	 */
	public sub(type: string, handler: (data: any) => any): void {
		process.on('message', message => {
			// Ignore third party messages
			if (message.namespace != this.namespace) return;

			// Ignore other event
			if (message.type != type) return;

			handler(message.data);
		});
	}
}

export const mount = new Xev().mount;
export const pub = new Xev().pub;
export const sub = new Xev().sub;
