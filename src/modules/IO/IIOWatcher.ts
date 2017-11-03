export default interface IIOWatcher {
	watchingDir: string;
	isRecursive: boolean;

	/**
	 * Creates a watcher to monitor every change in a directory
	 * @param {string} dir Directory to watch
	 * @param {boolean} isRecursive Whether or not the monitoring should be recursive
	 * @returns {Promise<void>} Fires when the operation is done
	 */
	watch(dir: string, isRecursive: boolean): Promise<void>;

	/**
	 * Subscribe function to a specific event
	 * @param {string} event Event to listen to
	 * @param {anonymous function} trigger The trigger callback
	 */
	on(event: string, trigger: (evt: string, name: string) => void): void;

	/**
	 * Close the watcher
	 */
	close(): void;

	/**
	 * Determines if the watcher is closed
	 */
	isClosed(): boolean;
}