const { remote } = require('electron');
const { Menu } = remote;
const path = require('path');

import {
	NotableFile
} from '../../../interfaces';

import FileNode from './FileNode';
import Events from '../Events/Events';

export default class Navigator {
	private defaultPath: string;
	private callback: (dirPath: string) => any;

	constructor(defaultPath: string, callback: (dirPath: string) => any) {
		this.defaultPath = defaultPath;
		this.callback = callback;
	}

	public updateNavigator(dirPath: string) {
		let navigation: HTMLDivElement =
			<HTMLDivElement>document.querySelector('.settings.navigation');
		let relativePath: string = dirPath.replace(this.defaultPath, '');
		if (relativePath[0] == path.sep) {
			relativePath = relativePath.substr(1);
		}
		let directorySplitted: string[];
		if (relativePath.length == 0) {
			directorySplitted = [];
		} else {
			directorySplitted = relativePath.split(path.sep);
		}

		while (directorySplitted.length + 1 != navigation.children.length) {
			if (directorySplitted.length + 1 > navigation.children.length) {
				let newPath: HTMLDivElement = document.createElement('div');
				newPath.className = 'pathItem';
				newPath.innerText = directorySplitted[navigation.children.length - 1];
				newPath.onclick = () => {
					let updatedPath: string = this.defaultPath + path.sep +
						directorySplitted.slice(0, navigation.children.length - 1).join(path.sep);
					this.callback(updatedPath);
				};
				navigation.appendChild(newPath);
			} else {
				if (navigation != null && navigation.lastElementChild != null) {
					navigation.lastElementChild.remove();
				}
			}
		}
	}
}