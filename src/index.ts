/*!
 * xev
 * Copyright (c) 2017 syuilo
 * MIT Licensed
 */

import * as cluster from 'cluster';
import autobind from './autobind';

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
	 * @param namespace Namespace
	 */
	constructor(namespace?: string) {
		this.namespace = namespace;
	}

	/**
	 * Mount event system.
	 * This method must be called in the master process.
	 */
	@autobind
	public mount(): void {
		if (cluster.isWorker) {
			throw 'Do not call this method in a worker process.';
		}

		const broadcast = message => {
			// Ignore third party messages
			if (message.namespace != this.namespace) return;

			// Broadcast the message to all workers
			for (const id in cluster.workers) {
				const worker = cluster.workers[id];
				worker.send(message);
			}
		}

		// When receiving a message from workers
		cluster.on('message', (_, message) => broadcast(message));

		// When receiving a message from the master
		process.on('message', broadcast);
	}

	/**
	 * Publish event
	 * @param type The name of the event
	 * @param data The payload of the event
	 */
	@autobind
	public pub(type: string, data?: any): void {
		const message = { type, data, namespace: this.namespace };

		if (cluster.isMaster) {
			process.emit('message', message);
		} else {
			process.send(message);
		}
	}

	/**
	 * Subscribe event
	 * @param type     The name of the event
	 * @param listener The callback function
	 */
	public sub(type: string, listener: (data: any) => any): void;

	/**
	 * Subscribe all events
	 * @param listener The callback function
	 */
	public sub(listener: (type: string, data: any) => any): void;

	@autobind
	public sub(x, y?): void {
		process.on('message', message => {
			// Ignore third party messages
			if (message.namespace != this.namespace) return;

			// When listen to all events
			if (typeof x == 'function') {
				x(message.type, message.data);
			}
			// When event name specified
			else if (message.type == x) {
				y(message.data);
			}
		});
	}
}

export const mount = new Xev().mount;
export const pub = new Xev().pub;
export const sub = new Xev().sub;
