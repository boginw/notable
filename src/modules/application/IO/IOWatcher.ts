const watch = require('node-watch');

import IIOWatcher from "./IIOWatcher";
import IO from "./IO";

export default class IOWatcher implements IIOWatcher {
	private _watchingDir: string;
	private _isRecursive: boolean;
	private io: IO;
	private watcher: any = undefined;

	/**
	 * Default constructor
	 */
	public constructor() {
		this.io = new IO();
	}

	/**
	 * Creates a watcher to monitor every change in a directory
	 * @param {string} dir Directory to watch
	 * @param {boolean} isRecursive Whether or not the monitoring should be recursive
	 * @returns {Promise<void>} Fires when the operation is done
	 */
	public watch(dir: string, isRecursive: boolean = true): Promise<void> {
		this._watchingDir = dir;
		this._isRecursive = isRecursive;

		return new Promise<void>((resolve: () => void, reject: (err: string) => void) => {
			this.io.exists(dir).then(() => {
				this._watchingDir = dir;
				this.watcher = watch(dir, { recursive: this.isRecursive });
				resolve();
			}).catch((err) => {
				reject(err);
			});
		});
	}

	public get watchingDir(): string {
		return this._watchingDir;
	}

	public get isRecursive(): boolean {
		return this._isRecursive;
	}

	/**
	 * Subscribe function to a specific event
	 * @param {string} event Event to listen to
	 * @param {anonymous function} trigger The trigger callback
	 */
	public on(event: string, trigger: (evt: string, name: string) => void): void {
		this.watcher.on(event, trigger);
	}

	/**
	 * Close the watcher
	 */
	public close(): void {
		if (this.watcher != undefined) {
			this.watcher.close();
		}
	}

	/**
	 * Determines if the watcher is closed
	 */
	public isClosed(): boolean {
		if (this.watcher != undefined) {
			return this.watcher.isClosed();
		}
		return true;
	}

}