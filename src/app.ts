import * as os from 'os'; // native node.js module
const { remote, ipcRenderer } = require('electron'); // native electron module
const { app, dialog, clipboard, Menu } = remote;
const jetpack = require('fs-jetpack'); // module loaded from npm
let mergeText = require('plus.merge-text');

import * as fs from 'fs';
import * as path from 'path';
import env from './env';

// Electron does not have HiDPI for Linux yet, so here's a workaround
import ZoomFactor from './modules/ZoomFactor/ZoomFactor';
import TitleBar from './modules/TitleBar/TitleBar';
import Explorer from './modules/Explorer/Explorer';
import Editor from './modules/Editor/Editor';
import Events from './modules/Events/Events';
import Modal from './modules/Modal/Modal';
import Persist from './modules/Persist/Persist';
import PlugMan from './PlugMan/PlugMan';

import {
	EditorModule,
	SimpleMDE,
	NotableFile
} from './interfaces';
import ISyncPlugin from './PlugMan/ISyncPlugin';
import SyncPrompt from './modules/Sync/SyncPrompt';

namespace Notable {

	class Notable {
		private openedFile: NotableFile | null;
		private explorer: Explorer;
		private startingPath: string;
		private saveIntervals: any;
		private editor: Editor;
		private modal: any;
		private plugman: PlugMan;
		private titleBar: TitleBar;

		/**
		 * Default constructor
		 */
		constructor() {
			this.startingPath = path.join(app.getPath('documents'), 'notes');

			// Zoom to defined scale (Linux specific)
			new ZoomFactor().zoom();

			// Create our title bar
			this.titleBar = new TitleBar(
				<HTMLElement>document.querySelector('.header.bordered'));

			// Initialize the editor
			this.editor = new Editor(this.startingPath);

			// Initialize project explorer
			this.explorer = new Explorer(this.startingPath);

			this.plugman = new PlugMan();
			this.plugman.loadPlugins(this.getContext()).then((plugins) => {
				plugins.forEach((plugin) => {
					if((plugin as ISyncPlugin).sync != undefined){
						let syncPlugin = plugin as ISyncPlugin;
						syncPlugin.login();
						Events.trigger("IOHandler.AddIO", syncPlugin);						
					}
				});

				console.log("Plugins loaded: ", plugins);
			}).catch((err) => {
				console.log("Plugin loading errored: ", err);
			});

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

			// Login with GitHub
			Events.on('titlebar.login', () => {
				let syncer = new SyncPrompt();
				syncer.show();
			});
		}

		public getContext() {
			return {
				"editor": this.editor,
				"explorer": this.explorer,
				"titlebar": this.titleBar,
				"events": Events,
				"persist": Persist,
				"modal": Modal,
				"startingPath": this.startingPath
			};
		}

		private saveCurrentFile(ignoreDialog?: boolean) {
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
		(<any>window).notable = new Notable();
	});


	/*let setApplicationMenu = () => {
		let menus: any[] = [editMenuTemplate];
		if (env.name !== 'production') {
			menus.push(devMenuTemplate);
		}
		Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
	};
	setApplicationMenu();*/

}