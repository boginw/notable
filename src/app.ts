import * as os from 'os'; // native node.js module
const fs = require('fs');
const path = require('path');
const { remote } = require('electron'); // native electron module
const { app, dialog, clipboard, Menu } = remote;
const jetpack = require('fs-jetpack'); // module loaded from npm

import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import env from './env';

// Electron does not have HiDPI for Linux yet, so here's a workaround
import ZoomFactor from './modules/application/ZoomFactor/ZoomFactor';
import TitleBar from './modules/application/TitleBar/TitleBar';
import Explorer from './modules/application/Explorer/Explorer';
import Editor from './modules/application/Editor/Editor';
import Events from './helpers/Events';

import {
	EditorModule,
	SimpleMDE,
	NotableFile
} from './interfaces';

namespace Notable {

	class Notable {
		private openedFile: NotableFile | null;
		private explorer: Explorer;
		private startingPath: string;
		private saveIntervals: any;
		private editor: Editor;
		/**
		 * Default constructor
		 */
		constructor() {
			this.startingPath = path.join(app.getPath('documents'), 'notes');

			// Zoom to defined scale (Linux specific)
			new ZoomFactor().zoom();

			// Create our title bar
			let titleBar:TitleBar = new TitleBar();

			// Initialize the editor
			this.editor = new Editor();

			// Initialize project explorer
			this.explorer = new Explorer(this.startingPath);

			// When the user opens a file
			Events.on('explorer.open', (file: NotableFile, contents: string) => {
				this.editor.openFile(
					file.name.replace(this.startingPath, ''), contents);
				this.openedFile = file;
			});

			// If the file doesn't exist anymore
			Events.on('explorer.deleted', (file: NotableFile) => {
				if (this.openedFile != null && file.name == this.openedFile.name) {
					this.editor.deletedFile();
					this.openedFile = null;
					alert("This file was deleted");
				}
			});

			// The file was renamed
			Events.on('explorer.rename', (file: NotableFile, newName: string) => {
				if (this.openedFile != null && file.name == this.openedFile.name) {
					this.openedFile = file;
					this.editor.openedFile = file.name.replace(this.startingPath, '');
				}
			});

			// The user is typing...
			Events.on('editor.change', () => {
				clearTimeout(this.saveIntervals);
				this.saveIntervals = setTimeout(() => {
					this.saveCurrentFile(true);
				}, 1500);
			});
		}

		private saveCurrentFile(ignoreDialog?: boolean) {
			console.log(this.openedFile);
			if (this.openedFile == null) {
				if (!ignoreDialog) {
					let filter = [{ name: "Markdown", extensions: ["md"] }];

					dialog.showSaveDialog({ title: "Save note", filters: filter, defaultPath: this.startingPath }, (filename) => {
						this.explorer.save(filename, this.editor.value());
						this.editor.saved = true;
					});
				}
				return;
			}

			this.explorer.save(this.openedFile.name, this.editor.value());
			this.editor.saved = true;
		}
	}

	document.addEventListener('DOMContentLoaded', () => {
		// Start application
		let notable:Notable = new Notable();
	});


	let setApplicationMenu = () => {
		let menus: any[] = [editMenuTemplate];
		if (env.name !== 'production') {
			menus.push(devMenuTemplate);
		}
		Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
	};
	setApplicationMenu();

}