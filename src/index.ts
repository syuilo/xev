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
	 * All listeners
	 */
	private listeners: { [event: string]: Function[] } = {};

	/**
	 * Whether is listening process messages
	 */
	private isListening: boolean = false;

	/**
	 * Whether is mounted
	 */
	private isMounted: boolean = false;

	/**
	 * Init event emitter
	 * @param namespace Namespace
	 */
	constructor(namespace?: string) {
		this.namespace = namespace;
	}

	/**
	 * Dispose this event emitter
	 */
	@autobind
	public dispose() {
		this.listeners = {};

		process.removeListener('message', this.onMessage);
		this.isListening = false;

		if (this.isMounted) {
			cluster.removeListener('message', this.onClusterMessageInMaster);
			process.removeListener('message', this.onProcessMessageInMaster);
			this.isMounted = false;
		}
	}

	@autobind
	private onMessage(message: any) {
		// Ignore third party messages
		if (message.namespace != this.namespace) return;

		// Call all wild listeners
		const wildListeners = this.listeners['*'] || [];
		wildListeners.forEach(listener => {
			listener(message.type, message.data);
		});

		// Call all named listeners
		const namedListeners = this.listeners[message.type] || [];
		namedListeners.forEach(listener => {
			listener(message.data);
		});
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

		// If already mounted
		if (this.isMounted) return;

		// When receiving a message from workers
		cluster.on('message', this.onClusterMessageInMaster);

		// When receiving a message from the master
		process.on('message', this.onProcessMessageInMaster);

		this.isMounted = true;
	}

	@autobind
	private onClusterMessageInMaster(sender, message) {
		this.onMessage(message);
		this.broadcast(message);
	}

	@autobind
	private onProcessMessageInMaster(message) {
		this.broadcast(message);
	}

	/**
	 * Broadcast the message to all workers
	 * @param message Message you want to broadcast
	 */
	@autobind
	private broadcast(message) {
		// Ignore third party messages
		if (message.namespace != this.namespace) return;

		// Send message to each all workers
		for (const id in cluster.workers) {
			const worker = cluster.workers[id];
			worker.send(message);
		}
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
		const type = typeof x == 'function' ? null : x;
		const listener = typeof x == 'function' ? x : y;

		const key = type || '*';

		// For first listen
		if (!this.listeners.hasOwnProperty(key)) {
			this.listeners[key] = [];
		}

		// Register listener
		this.listeners[key].push(listener);

		// Start listen if still not listening
		if (!this.isListening) {
			this.isListening = true;
			process.addListener('message', this.onMessage);
		}
	}

	/**
	 * Unsubscribe event
	 * @param type     The name of the event
	 * @param listener The callback function
	 */
	public unsub(type: string, listener: (data: any) => any): void;

	/**
	 * Unsubscribe all events
	 * @param listener The callback function
	 */
	public unsub(listener: (type: string, data: any) => any): void;

	@autobind
	public unsub(x, y?): void {
		const type = typeof x == 'function' ? null : x;
		const listener = typeof x == 'function' ? x : y;

		const key = type || '*';

		const listeners = this.listeners[key];

		// Remove listeners
		for (let i = 0, l; l = listeners && listeners[i]; i++) {
			if (l == listener) listeners.splice(i--, 1);
		}
	}
}

export const mount = new Xev().mount;
export const pub = new Xev().pub;
export const sub = new Xev().sub;
