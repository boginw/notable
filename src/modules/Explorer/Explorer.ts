const { remote } = require('electron');
const { Menu } = remote;
const path = require('path');

import {
	NotableFile,
	ExplorerContexts,
	NoteBook
} from '../../interfaces';
import TimeAgo from '../../helpers/timeago';
import Events from '../Events/Events';
import IO from '../IO/IO';
import IIO from '../IO/IIO';
import Persist from '../Persist/Persist';

import FileNode from './FileNode';
import Render from './Render';
import Navigator from './Navigator';
import IIOWatcher from '../IO/IIOWatcher';

export default class Explorer {
	private defaultPath: string;
	private currentPath: string;
	private base: HTMLDivElement;
	private root: HTMLUListElement;
	private fileNodes: FileNode[] = [];
	private fileTree: FileNode[] = [];
	private navigator: Navigator;
	private io:IIO;

	// Sort by date?
	// TODO: move this elsewhere (preferably in a persiatant form)
	private sortalpha: boolean = true;

	/**
	 * Default constructor
	 * @param {string} defaultPath The path inwhich the explorer
	 *                             should start 
	 */
	constructor(defaultPath: string) {
		this.io = new IO();
		this.defaultPath = defaultPath;
		// Find our base for files and folders
		this.base = <HTMLDivElement>document.querySelector('.folders_and_files');

		// Ensure that the default path exists
		let ensurement = this.io.ensureFolderExists(defaultPath);

		ensurement.then(()=>{
			let settings: any = Persist.load('explorer');
			this.navigator = new Navigator(this.defaultPath, (dir)=>{
				this.closeDirectory(dir);
			});
	
			let homeDirNavigation: HTMLDivElement =
				<HTMLDivElement>document.querySelector('.pathItem.home');
	
			homeDirNavigation.onclick = () => {
				this.closeDirectory(this.defaultPath);
			};
	
			Render.emptyContextMenu(this.base);
	
			this.currentPath = defaultPath;
	
			this.sortalpha = !settings.sort;
			this.sortSwitch(settings.sort, (val) => {
				settings.sort = val;
				this.sortalpha = !val;
				this.sortFiles();
	
				this.root = Render.rerender(this.fileNodes, this.root, this.base);
				Persist.save('explorer', settings);
			});
	
			this.monitor(defaultPath);
			this.fileEvents();
	
			// Maybe activate this again later
			this.openDirectory(defaultPath);
		});

		ensurement.catch(()=>{
			throw "Could not ensure that " + defaultPath + " exists...";
		});
	}

	public save(filePath: string, contents: string): void {
		this.io.saveFile(filePath, contents);
	}

	private sortSwitch(on: boolean, change: (val: boolean)=>any){
		let switchBase: HTMLLabelElement = 
			<HTMLLabelElement> document.querySelector('.sort .switch');
		let switchEl: HTMLInputElement = 
			<HTMLInputElement> switchBase.querySelector('input[type=checkbox]');

		switchEl.checked = on;

		switchEl.onchange = (event: Event) => {
			change(switchEl.checked);
		};
	}

	private newFile(isFile: boolean = true): void {
		let newFile: FileNode = new FileNode(isFile);
		if(this.fileNodes.length == 0){
			this.root.innerHTML = '';
		}
		this.root.appendChild(newFile.node);
	}

	private clickFile(filenode: FileNode): void {
		if (!filenode.file.stat.isDirectory()) {
			this.io.openFile(filenode.file.name).then((contents:string)=>{
				Events.trigger('explorer.open',
					filenode.file,
					contents
				);
			});

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
					this.io.deleteFile(filenode.file.name);
				}
			} else {
				if (confirm("Are you sure you want to delete this folder and all its contents? This cannot be undone.")) {
					filenode.fileRemoved();
					this.io.deleteFolder(filenode.file.name);
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

			this.io.rename(filenode.file.name, newFile.name).then(()=>{
				Events.trigger('rename',
					filenode.file, newFile.name
				);
				filenode.file = newFile;
			});
		});

		Events.on('file.create', (filenode: FileNode, contents: string) => {
			let filename: string = path.join(this.currentPath, contents);
			if (filenode.isFile) {
				filename += '.md';
				this.io.saveFile(filename, "").then(()=>{
					this.insertFile(filename, false, true);
				});
			} else {
				this.io.createFolder(filename).then(() => {
					this.insertFile(filename, false, true);
				});
			}
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
		this.io.watchDir(dir).then((watcher:IIOWatcher) => {
			watcher.on('change', (evt:string, name:string)=>{
				let index: number;
				switch(evt){
					case 'update':
						index = this.findFile(name);
						if (index != -1) {
							this.io.fileFromPath(name).then((changedFile:NotableFile)=>{
								this.fileTree[index].file = changedFile;
								this.io.openFile(this.fileTree[index].file.name).then((contents:string)=>{
									Events.trigger('changed',
										this.fileTree[index].file,
										contents
									);
								});
							});
						} else {
							this.insertFile(name);	
						}
						break;
					case 'remove':
						index = this.findFile(name);
						if (index != -1) {
							this.fileTree[index].fileRemoved();
							Events.trigger('deleted',
								this.fileTree[index].file,
							);
							this.fileTree.splice(index, 1);
						}
						break;
				}
			});
			
			watcher.on('error', (err:string)=>{
				throw err;
			});
		});
	}

	private insertFile(filepath: string, stats?: any, openAfter?: boolean): Promise<FileNode> {
		let index: number = this.findFile(filepath);
		if (index == -1) {
			return new Promise<FileNode>(
				(resolve: (value:FileNode) => void, reject:(reason: string)=> void) => {
					this.io.fileFromPath(filepath, stats).then((file:NotableFile)=>{
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

						resolve(fileNode);
					});
				});
		}
		
		return new Promise<FileNode>(
			(resolve: (value:FileNode) => void, reject:(reason: string)=> void) => {
				this.io.fileFromPath(filepath).then((file:NotableFile)=>{
					this.fileTree[index].file = file;
	
					if (openAfter) {
						this.clickFile(this.fileTree[index]);
					}
					
					resolve(this.fileTree[index]);
			});
		});
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

	// TODO: merge with closeDirectory
	private openDirectory(dirPath: string): void {
		this.io.filesInDirectory(dirPath).then((files:NotableFile[])=>{
			for(let i = 0; i < files.length; i++){
				this.fileTree.push(this.createFileNode(files[i]));
			}
		
			// Scan the new folder
			this.fileNodes = this.fileTree.filter((fileNode: FileNode): boolean => {
				return path.dirname(fileNode.file.name) == dirPath;
			});
	
			this.sortFiles();
			this.navigator.updateNavigator(dirPath);
	
			// Create a new root
			let newRoot: HTMLUListElement = Render.renderExplorer(this.fileNodes);
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
					setTimeout(()=>{
						newRoot.focus();
					},50);
					oldRoot.remove();
				}, false);
			}
	
			this.root = newRoot;
			this.currentPath = dirPath;
		});
	}

	private closeDirectory(dirPath: string): void {
		if (dirPath == this.currentPath) {
			return;
		}

		this.navigator.updateNavigator(dirPath);

		this.fileNodes = this.fileTree.filter((fileNode: FileNode): boolean => {
			return path.dirname(fileNode.file.name) == dirPath;
		});

		this.sortFiles();
		let newRoot: HTMLUListElement = Render.renderExplorer(this.fileNodes);
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
			setTimeout(()=>{
				newRoot.focus();
			},50);		
			oldRoot.remove();
		}, false);

		this.currentPath = dirPath;
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

	
}
