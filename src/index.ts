/*!
 * xev
 * Copyright (c) 2017 syuilo
 * MIT Licensed
 */

import { EventEmitter } from 'node:events';
import cluster from 'node:cluster';
import autobind from './autobind';

/**
 * Global Event Emitter
 */
export default class Xev extends EventEmitter {
	/**
	 * Namespace
	 */
	public namespace: string | undefined;

	/**
	 * Whether is mounted
	 */
	private isMounted: boolean = false;

	/**
	 * Init event emitter
	 * @param namespace Namespace
	 */
	constructor(namespace?: string) {
		super();
		this.namespace = namespace;

		//this.once('newListener', () => {
			process.addListener('message', this.onMessage);
		//});
	}

	/**
	 * Dispose this event emitter
	 */
	@autobind
	public dispose() {
		this.removeAllListeners();

		process.removeListener('message', this.onMessage);

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

		super.emit('*', message.type, message.data);
		super.emit(message.type, message.data);
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
		process.emit('message', message, null);
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
			const worker = cluster.workers[id]!;
			worker.send(message);
		}
	}

	/**
	 * Publish event
	 * @param type The name of the event
	 * @param data The payload of the event
	 * @return Always true
	 */
	@autobind
	public emit(type: string, data?: any): boolean {
		const message = { type, data,
			namespace: this.namespace };

		if (cluster.isPrimary) {
			process.emit('message', message, null);
		} else {
			process.send!(message);
		}

		return true;
	}
}
