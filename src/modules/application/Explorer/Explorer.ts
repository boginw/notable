const { remote } = require('electron');
const { Menu } = remote;
const path = require('path');

import {
	NotableFile,
	ExplorerContexts,
	NoteBook
} from '../../../interfaces';
import TimeAgo from '../../../helpers/timeago';
import Events from '../../../modules/application/Events/Events';
import IO from '../IO/IO';
import FileNode from './FileNode';

export default class Explorer {
	private defaultPath: string;
	private currentPath: string;
	private base: HTMLDivElement;
	private root: HTMLUListElement;
	private fileNodes: FileNode[] = [];
	private fileTree: FileNode[] = [];
	// Sort by date?
	// TODO: move this elsewhere (preferably in a persiatant form)
	private sortalpha: boolean = true;

	/**
	 * Default constructor
	 * @param {string} defaultPath The path inwhich the explorer
	 *                             should start 
	 */
	constructor(defaultPath: string) {

		this.defaultPath = defaultPath;
		// Find our base for files and folders
		this.base = <HTMLDivElement>document.querySelector('.folders_and_files');

		// Ensure that the default path exists
		if (!IO.ensureFolderExists(defaultPath)) {
			throw "Could not ensure that " + defaultPath + " exists...";
		}

		let homeDirNavigation: HTMLDivElement =
			<HTMLDivElement>document.querySelector('.pathItem.home');

		homeDirNavigation.onclick = () => {
			this.closeDirectory(this.defaultPath);
		};

		this.emptyContextMenu(this.base);

		this.currentPath = defaultPath;

		this.monitor(defaultPath);
		this.fileEvents();

		// Maybe activate this again later
		// this.openDirectory(defaultPath);
	}

	public save(filePath: string, contents: string): void {
		IO.saveFile(filePath, contents);
	}

	private emptyContextMenu(base: HTMLElement, strict: boolean = true) {
		base.addEventListener('contextmenu', (ev: PointerEvent) => {
			if (ev.srcElement == this.root || !strict) {
				Menu.buildFromTemplate([
					{
						label: 'New Note',
						role: 'new',
						click: () => {
							Events.trigger('file.newFile');
						},
					}, {
						label: 'New Folder',
						role: 'newFolder',
						click: () => {
							Events.trigger('file.newFolder');
						},
					}, {
						type: 'separator',
					}, {
						label: 'Folder Properties',
						role: 'propFolder',
					}
				]).popup(remote.getCurrentWindow());
			}
		}, true);
	}

	private newFile(isFile: boolean = true): void {
		let newFile: FileNode = new FileNode(isFile);

		this.root.appendChild(newFile.node);
	}

	private clickFile(filenode: FileNode): void {
		if (!filenode.file.stat.isDirectory()) {
			Events.trigger('explorer.open',
				filenode.file,
				IO.openFile(filenode.file.name)
			);

			this.fileTree.forEach(element => {
				element.setOpen(false);
			});
			filenode.setOpen(true);
		} else {
			this.openDirectory(filenode.file.name);
		}
	}

	private fileEvents(): void {

		Events.on('file.click', (filenode: FileNode) => {
			this.clickFile(filenode);
		});

		Events.on('file.delete', (filenode: FileNode) => {
			if (!filenode.file.stat.isDirectory()) {
				if (confirm("Are you sure you want to delete this file? This cannot be undone.")) {
					filenode.fileRemoved();
					IO.deleteFile(filenode.file.name);
				}
			} else {
				if (confirm("Are you sure you want to delete this folder and all its contents? This cannot be undone.")) {
					filenode.fileRemoved();
					IO.deleteFolder(filenode.file.name);
				}
			}
		});

		Events.on('file.rename', (filenode: FileNode, contents: string) => {
			let pathArray: string[] = filenode.file.name.split(path.sep);
			pathArray.pop();
			pathArray.push(contents);

			let newName: string = pathArray.join(path.sep);

			if (filenode.file.stat.isDirectory()) {
				this.fileTree.forEach(f => {
					if (f != filenode && f.file.name.split(path.sep) == filenode.file.name.split(path.sep)) {
						f.file.name = f.file.name.replace(filenode.file.name, newName);
					}
				});
			}

			let newFile: NotableFile = <NotableFile>{
				name: newName,
				extension: filenode.file.extension,
				stat: filenode.file.stat,
				open: filenode.file.open,
				childrens: filenode.file.childrens,
				preview: filenode.file.preview,
			};

			IO.rename(filenode.file.name, newFile.name);

			Events.trigger('rename',
				filenode.file, newFile.name
			);
			filenode.file = newFile;
		});

		Events.on('file.create', (filenode: FileNode, contents: string) => {
			let filename: string = path.join(this.currentPath, contents);
			if (filenode.isFile) {
				filename += '.md';
				IO.saveFile(filename, "");
			} else {
				IO.createFolder(filename);
			}

			let node: FileNode = this.insertFile(filename, false, true);
		});

		Events.on('file.newFolder', () => {
			this.newFile(false);
		});

		Events.on('file.newFile', () => {
			this.newFile();			
		});
	}


	// TODO: needs more abstraction
	/**
	 * Monitors a directory for file changes, new files and file
	 * deletions.
	 * @param {string} dir Directory to monitor
	 */
	private monitor(dir: string): void {
		IO.watchDirectory(dir, (f: string | object, curr, prev) => {
			if (typeof f == "object" && prev === null && curr === null) {
				// Finished walking the tree
				console.log("Directory monitor ready");
				this.fileTree = [];

				for (let key in f) {
					this.fileTree.push(
						this.createFileNode(IO.fileFromPath(key, f[key])));
				}

				this.openDirectory(dir);
			} else if (prev === null) {
				// f is a new file
				this.insertFile(f.toString(), curr);

			} else if (curr.nlink === 0) {
				// f was removed
				let index: number = this.findFile(f.toString());
				if (index != -1) {
					this.fileTree[index].fileRemoved();
					Events.trigger('deleted',
						this.fileTree[index].file,
					);
					this.fileTree.splice(index, 1);
				}
			} else {
				// f was changed
				let index: number = this.findFile(f.toString());
				if (index != -1) {
					this.fileTree[index].file =
						IO.fileFromPath(f.toString(), curr);
					Events.trigger('changed',
						this.fileTree[index].file,
						IO.openFile(this.fileTree[index].file.name)
					);
				}
			}
		});
	}

	private insertFile(filepath: string, stats?: any, openAfter?: boolean): FileNode {
		let index: number = this.findFile(filepath);
		if (index == -1) {
			let file: NotableFile = stats == undefined ?
				IO.fileFromPath(filepath) :
				IO.fileFromPath(filepath, stats);
			let fileNode: FileNode = this.createFileNode(file);
			let inserted: boolean = false;

			if (path.dirname(file.name) == this.currentPath) {
				for (let i = 0; i < this.fileNodes.length; i++) {
					if (this.sorter(fileNode, this.fileNodes[i]) == -1) {
						this.root.insertBefore(fileNode.node, this.fileNodes[i].node);
						inserted = true;
						this.fileNodes.splice(i, 0, fileNode);
						break;
					}
				}
				if (!inserted) {
					this.root.appendChild(fileNode.node);
				}
			}

			this.fileTree.push(fileNode);
			if (openAfter) {
				this.clickFile(fileNode);
			}

			return fileNode;
		} else {
			this.fileTree[index].file = stats == undefined ?
				IO.fileFromPath(filepath) :
				IO.fileFromPath(filepath, stats);
		}

		if (openAfter) {
			this.clickFile(this.fileTree[index]);
		}
		return this.fileTree[index];
	}

	/**
	 * Searches for the index of a file in the fileNodes
	 * array.
	 * @param {string} filePath Path to the file to search for
	 * @return {number} Index of file in array, or -1 if not found
	 */
	private findFile(filePath: string): number {
		for (let i = 0; i < this.fileTree.length; i++) {
			if (this.fileTree[i].file.name == filePath) {
				return i;
			}
		}
		return -1;
	}

	/**
	 * Scan folder for files
	 * @param {string} dir Directory to scan
	 */
	private scanFolder(dir: string): FileNode[] {
		// Get all files in the current working directory
		let files: NotableFile[] = IO.filesInDirectory(dir);
		let fileNodes: FileNode[] = [];
		// Render and store files
		for (let i = 0; i < files.length; i++) {
			fileNodes.push(this.createFileNode(files[i]));
		}
		return fileNodes;
	}

	// TODO: merge with closeDirectory
	private openDirectory(dirPath: string): void {
		// Scan the new folder
		this.fileNodes = this.fileTree.filter((fileNode: FileNode): boolean => {
			return path.dirname(fileNode.file.name) == dirPath;
		});

		this.sortFiles();
		this.updateNavigator(dirPath);

		// Create a new root
		let newRoot: HTMLUListElement = this.renderExplorer(this.fileNodes);
		this.base.appendChild(newRoot);

		if (this.root != undefined) {

			newRoot.classList.add("animateIn");
			// TODO: find it again?
			newRoot = <HTMLUListElement>document.querySelector('.animateIn');
			// Old root animate out
			this.root.classList.add('animateOut');

			// Timeout needed for some wierd reason
			setTimeout(() => {
				// Animate new root in
				newRoot.classList.remove('animateIn');
			}, 5);

			// Switch roots
			let oldRoot: HTMLUListElement = this.root;

			oldRoot.addEventListener("transitionend", function (event) {
				oldRoot.remove();
			}, false);
		}

		this.root = newRoot;
		this.currentPath = dirPath;
	}

	private closeDirectory(dirPath: string): void {
		if (dirPath == this.currentPath) {
			return;
		}

		this.updateNavigator(dirPath);

		this.fileNodes = this.fileTree.filter((fileNode: FileNode): boolean => {
			return path.dirname(fileNode.file.name) == dirPath;
		});

		this.sortFiles();
		let newRoot: HTMLUListElement = this.renderExplorer(this.fileNodes);
		newRoot.classList.add("animateOut");
		this.base.appendChild(newRoot);
		// TODO: find it again?
		newRoot = <HTMLUListElement>document.querySelector('.animateOut');
		// Old root animate out
		this.root.classList.add('animateIn');

		// Timeout needed for some wierd reason
		setTimeout(() => {
			// Animate new root in
			newRoot.classList.remove('animateOut');
		}, 5);

		// Switch roots
		let oldRoot: HTMLUListElement = this.root;
		this.root = newRoot;

		oldRoot.addEventListener("transitionend", function (event) {
			oldRoot.remove();
		}, false);

		this.currentPath = dirPath;
	}

	private updateNavigator(dirPath: string) {
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
					this.closeDirectory(updatedPath);
				};
				navigation.appendChild(newPath);
			} else {
				if (navigation != null && navigation.lastElementChild != null) {
					navigation.lastElementChild.remove();
				}
			}
		}
	}

	private createFileNode(file: NotableFile): FileNode {
		let filenode: FileNode = new FileNode(file);
		return filenode;
	}

	/**
	 * Sorts the files in an alphabetical order or 
	 * most recently created order
	 */
	private sortFiles(): void {
		this.fileNodes = this.fileNodes.sort((a: FileNode, b: FileNode) => {
			return this.sorter(a, b);
		});
	}

	/**
	 * Sorting comparing function for sorting files
	 * @param {boolean} alpha Should sort alphabetically
	 * @return {number} Should come before, after, doesn't matter
	 */
	private sorter(a: FileNode, b: FileNode): number {
		if (a.file.stat.isDirectory() && !b.file.stat.isDirectory()) {
			return -1;
		} else if (!a.file.stat.isDirectory() && b.file.stat.isDirectory()) {
			return 1;
		}

		if (!this.sortalpha) {
			// Time sort
			return b.file.stat.mtime.getTime() - a.file.stat.mtime.getTime();
		}

		// Alphabetical sort
		let aName: string = path.basename(a.file.name);
		let bName: string = path.basename(b.file.name);
		if (aName < bName) {
			return -1;
		}
		if (aName > bName) {
			return 1;
		}
		return 0;
	}

	/**
	 * Renders the explorer side-bar
	 * @param dir Directory to render
	 * @param base Base html element
	 */
	private renderExplorer(files: FileNode[]): HTMLUListElement {
		let newRoot: HTMLUListElement = document.createElement('ul');

		// No files? show message that folder is empty
		if (files.length == 0) {
			newRoot.appendChild(this.renderEmpty());
			return newRoot;
		}

		// Render files
		for (let i = 0; i < files.length; i++) {
			newRoot.appendChild(files[i].node);
		}

		return newRoot;
	}

	/**
	 * Show that this folder is empty by displaying a message
	 * @return {HTMLDivElement} Element containing message
	 */
	private renderEmpty(): HTMLDivElement {
		let empty: HTMLDivElement = document.createElement('div');
		empty.className = "empty-folder";
		empty.innerHTML = `<div>
            <i class="icon material-icons">sentiment_neutral</i>
            <h3>This folder seems empty...</h3>
            <h4>Would you like to create a notebook?<br />Just right-click here!</h4>
        </div>`;
		this.emptyContextMenu(empty, false);
		return empty;
	}
}
