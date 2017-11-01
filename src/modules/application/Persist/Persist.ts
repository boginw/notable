const { app } = require('electron').remote; // native electron module
const path = require('path');
let fs = require('fs');

import IO from '../IO/IO';

const userData = app.getPath('userData');

export default class Persist {
	public static io:IO;
	public static load(key: string): any {
		let stateStoreFile = 'window-state-' + key + '.json';
		let fullPath = path.join(userData, stateStoreFile);
		
		if (fs.exists(fullPath)) {
			try {
				return JSON.parse(fs.openSync(fullPath));
			} catch (err) {
				return {};
			}
		} else {
			return {};
		}
	}

	public static save(key: string, value: object, callback?: () => any): void {
		let stateStoreFile = 'window-state-' + key + '.json';
		let fullPath = path.join(userData, stateStoreFile);

		if(this.io == undefined){
			this.io = new IO();
		}

		this.io.saveFile(fullPath, JSON.stringify(value)).then(() => {
			if (callback != undefined) {
				callback();
			}
		});
	}
}