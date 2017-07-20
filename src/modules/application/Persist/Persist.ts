const { app } = require('electron').remote; // native electron module
const path = require('path');

import IO from '../IO/IO';

const userData = app.getPath('userData');

export default class Persist {
	public static load(key: string): any {
		let stateStoreFile = 'window-state-' + key + '.json';
		let fullPath = path.join(userData, stateStoreFile);

		if (IO.exists(fullPath)) {
			try {
				return JSON.parse(IO.openFile(fullPath));
			} catch (err) {
				return {};
			}
		} else {
			return {};
		}
	}

	public static save(key: string, value: object, callback?: (contents: string) => any): void {
		let stateStoreFile = 'window-state-' + key + '.json';
		let fullPath = path.join(userData, stateStoreFile);

		IO.saveFile(fullPath, JSON.stringify(value), (contents: string) => {
			if (callback != undefined) {
				callback(contents);
			}
		});
	}
}