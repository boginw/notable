export default class Events {
	private static event: any = {};

	/**
	 * Subscribe function to a specific event
	 * @param {string} event Event to listen to
	 * @param {anonymous function} trigger The trigger callback
	 */
	public static on(event: string, trigger: (...args: any[]) => void): void {
		// Check if the event exists
		if (this.event[event] == undefined) {
			this.event[event] = [];
		}
		// Subscribe
		this.event[event].push(trigger);
	}

	/**
	 * Triggers a file related event 
	 * @param {string} event Event to trigger
	 * @param {NotableFile} notableFile File involved in the triggering
	 * @param {string} contents Contents of the file triggered
	 */
	public static trigger(event: string, ...args: any[]): void {
		// Ensure that the event exists
		if (this.event[event] !== undefined) {
			// Trigger all subscribers 
			this.event[event].forEach(element => {
				element(...args);
			});
		}
	}
}