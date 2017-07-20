const { remote } = require('electron');
const { Menu, MenuItem, shell } = remote;
const path = require('path');
const openClass: string = 'open';

import {
	NotableFile,
} from '../../../interfaces';
import TimeAgo from '../../../helpers/timeago';
import Events from '../../../modules/application/Events/Events';

export default class FileNode {
	public node: HTMLLIElement;
	private _file: NotableFile;
	private ta: TimeAgo;
	private _open: boolean;
	private base: HTMLLIElement;
	private renameInput: HTMLInputElement;
	private _isFile: boolean;

	get file(): NotableFile {
		return this._file;
	}

	get isFile(): boolean {
		return this._isFile;
	}

	// Everytime file us updated, the file should rerender
	set file(notafile: NotableFile) {
		this._file = notafile;
		this.node = this.renderItem(this.file);
		// Store events
		this.setEvents();
	}

	get open(): boolean {
		return this._open;
	}

	set open(o: boolean) {
		this._open = o;
		this.setOpen(o);
	}

	/**
	 * Default constructor
	 * @param {NotableFile|boolean} file Notable file or
	 *  used for creating new files, this boolean determines
	 *  if the new item will be a file or a folder
	 */
	constructor(file: NotableFile | boolean) {
		// For "time ago" strings
		this.ta = new TimeAgo();

		// Base should only be created once
		this.base = document.createElement('li');

		if (typeof (file) != 'boolean') {
			// Store file, and render
			this.file = file;
		} else {
			this._isFile = file;
			// This will be a new file or folder
			this.node = this.renderItem(file);
			this.renameFile();
			this.setEvents();
		}
	}

	public renameFile(): void {
		let inputField: HTMLInputElement = <HTMLInputElement>
			this.base.querySelector('.inputTitleText');
		inputField.style.display = 'inline-block';
		inputField.placeholder = 'Enter file name';
		inputField.tabIndex = -1;
		inputField.value = this.fileDisplayName(this.file);
		// Needs to be async for some reason
		setTimeout(() => {
			inputField.focus();
		}, 1);

		inputField.setSelectionRange(0, inputField.value.length);
	}

	public renameFileBlur(): void {
		if (!this.file) {
			this.fileRemoved();
			return;
		}
		let inputField: HTMLInputElement = <HTMLInputElement>
			this.base.querySelector('.inputTitleText');
		inputField.style.display = 'none';
		inputField.value = '';
	}

	/**
	 * Destroy node
	 */
	public fileRemoved(): void {
		if (this.node) {
			try {
				this.node.remove();
			} catch (err) {
				console.log(err);
			}
		}
	}

	/**
	 * Sets if the file is open
	 * @param {boolean} isOpen Whether the file is open or not
	 */
	public setOpen(isOpen: boolean): void {
		if (this.base != undefined) {
			if (isOpen) {
				this.base.classList.add(openClass);
			} else {
				this.base.classList.remove(openClass);
			}
		}
	}

	/**
	 * Set file related events
	 */
	private setEvents(): void {
		// Click events
		this.base.onclick = () => {
			if (inputField.style.display != 'inline-block') {
				Events.trigger('file.click', this);
			}
		};
		this.base.ondblclick = () => {
			this.renameFile();
			Events.trigger('file.dbclick', this);
		};
		this.base.oncontextmenu = () => {
			Events.trigger('file.contextmenu', this);
			this.rightclick();
		};

		// Drag events
		this.base.ondragstart = () => {
			Events.trigger('file.dragstart', this);
		};
		this.base.ondragover = () => {
			Events.trigger('file.dragover', this);
		};
		this.base.ondragenter = () => {
			Events.trigger('file.dragenter', this);
		};
		this.base.ondrop = () => {
			Events.trigger('file.drop', this);
		};

		// Rename events
		// TODO: this doesn't work with this.renameInput, but this is good enough
		let inputField: HTMLInputElement = <HTMLInputElement>
			this.base.querySelector('.inputTitleText');

		inputField.addEventListener('keypress', (ev: KeyboardEvent) => {
			if (ev.keyCode == 13) {
				let newName: string = inputField.value;

				if (this._file == undefined) {
					Events.trigger('file.create', this, newName);
				} else {
					if (!this._file.stat.isDirectory()) {
						newName += this.file.extension;
					}

					Events.trigger('file.rename', this, newName);
				}
				this.renameFileBlur();
			}
		}, true);

		inputField.onblur = () => {
			this.renameFileBlur();
		};
	}

	/**
	 * Handle rightclick context menus
	 */
	private rightclick(): any {
		if (this.file.stat.isDirectory()) {
			Menu.buildFromTemplate([
				{
					label: 'Rename',
					role: 'rename',
					click: this.renameFile(),
				}, {
					label: 'Delete Folder',
					role: 'delFolder',
					click: () => {
						Events.trigger('file.delete', this);
					},
				}, {
					type: 'separator',
				}, {
					label: 'New Folder',
					role: 'newFolder',
					click: () => {
						Events.trigger('file.newFolder');
					},
				}, {
					label: 'New Note',
					role: 'new',
					click: () => {
						Events.trigger('file.newFile');
					},
				}, {
					type: 'separator',
				}, {
					label: 'Folder Properties',
					role: 'propFolder',
				}
			]).popup(remote.getCurrentWindow());
		} else {
			Menu.buildFromTemplate([
				{
					label: 'Rename',
					role: 'rename',
					click: this.renameFile(),
				}, {
					label: 'Delete',
					role: 'deleteFile',
					click: () => {
						Events.trigger('file.delete', this);
					},
				}, {
					type: 'separator',
				}, {
					label: 'New Folder',
					role: 'newFolder',
					click: () => {
						Events.trigger('file.newFolder');
					},
				}, {
					label: 'New Note',
					role: 'new',
					click: () => {
						Events.trigger('file.newFile');
					},
				}, {
					type: 'separator',
				}, {
					label: 'Open Containing Folder',
					role: 'openfolder',
					click: () => {
						shell.showItemInFolder(this.file.name);
					}
				}
			]).popup(remote.getCurrentWindow());
		}
	}

	/**
	 * Strips extensions  of files and returns the base
	 * filename
	 * @param  {file} 	 file 	file from getDirectoriesInPath
	 * @return {string}	  	Filename without extension
	 */
	private fileDisplayName(file?: NotableFile): string {
		if (file) {
			let fname: string = file.stat.isDirectory() ? file.name :
				file.name.substr(0, file.name.length - file.extension.length);

			return path.basename(fname);
		}
		return '';
	}

	/**
	 * Renders an item from the file system
	 * @param {NotableFile} file Item to render
	 * @return {HTMLLIElement} Rendered item
	 */
	// TODO: rewrite
	private renderItem(file: NotableFile | boolean): HTMLLIElement {
		let isFile = typeof file != 'boolean';
		// Clean base html so we don't add dublicates
		this.base.innerHTML = '';

		// Create contents container
		let contents: HTMLSpanElement = document.createElement('span');

		// Create file title and preview        
		let title: HTMLDivElement = document.createElement('div');
		title.className = "title" + (isFile ? '' : ' newfile');
		title.innerHTML = `<span class="titleText">${typeof file != 'boolean' ? this.fileDisplayName(file) : 'n'}</span>`;

		this.renameInput = document.createElement('input');
		this.renameInput.className = "inputTitleText";

		title.appendChild(this.renameInput);

		let timeAgo: string = typeof file != 'boolean' ? this.ta.ago(new Date(file.stat.atime)) : '';
		// Only files have preview and lastmod
		if ((!isFile && file) || (typeof file != 'boolean' && !file.stat.isDirectory())) {
			// Files should be draggable
			this.base.draggable = true;

			contents.className = "fileName";
			// Time ago since file was created
			title.innerHTML += `
                <div class="fileDetails">
                    <div class="lastMod">${timeAgo}</div>
                    <div class="filePrev">${typeof file != 'boolean' ? file.preview : ''}</div>
                </div>`;
		} else {
			contents.className = "folderName";
			title.innerHTML += `<i class="material-icons">keyboard_arrow_right</i>
                <div class="fileDetails">
                    <!--<div class="lastMod">${timeAgo}</div>-->
                    ${isFile ? `<div class="filePrev">${this.file.childrens} 
					note${this.file.childrens == 1 ? '' : 's'} in this notebook</div>` : ''}
                </div>`;
		}

		contents.appendChild(title);
		this.base.appendChild(contents);
		return this.base;
	}
}