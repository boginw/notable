let fs = require('fs');
let path = require('path');

import {
	NotableFile
} from '../../../interfaces';

import IIO from './IIO';
import IIOWatcher from './IIOWatcher';
import IOWatcher from './IOWatcher';

export default class IO implements IIO{

	/**
	 * Opens file and gets its contents
	 * @param {string}  fileName File to open
	 * @return {Promise<string>} File contents
	 */
	public openFile(fileName: string): Promise<string> {
		let p = new Promise<string>((resolve: (value:string) => void, reject:(reason: string)=> void) => {
			// Do we have access?
			let access: any = fs.accessSync(fileName, fs.F_OK);
			// Open the file
			fs.readFile(fileName, (err, data) => {
				if(err){
					reject(err);
					return;					
				}
				resolve(data.toString());
			});
		});
		return p;
	}

	/**
	 * Saves contents to file
	 * @param {string} path Path to file
	 * @param {string} contents Contents to be written to the file 
	 * @returns {Promise<void>} Fires when the operation has been completed
	 */
	public saveFile(path: string, contents: string): Promise<void> {
		let p = new Promise<void>((resolve: () => void, reject:(reason: string)=> void) => {
			fs.writeFile(path, contents, (err: string) => {
				this.callackVoidResolve(err, resolve, reject);				
			});
		});
		return p;
	}

	/**
	 * Deletes a file
	 * @param {string} path File to delete
	 * @returns {Promise<void>} Fires when the operation has been completed
	 */
	public deleteFile(path: string): Promise<void> {
		let p = new Promise<void>((resolve: () => void, reject:(reason: string)=> void) => {			
			fs.unlink(path, (err: string) => {
				this.callackVoidResolve(err, resolve, reject);
			});
		});
		return p;		
	}

	/**
	 * Recursively deletes a folder (DO NOT USE OUTSIDE NOTE ENVIROMENT!)
	 * @param {string} dirPath Folder to delete
	 * @returns {Promise<void>} Fires when the operation has been completed 
	 */
	public deleteFolder(dirPath: string): Promise<void> {
		return new Promise<void>((resolve: () => void, reject:(reason: string)=> void) => {			
			let exists = this.exists(dirPath);
			exists.catch(()=>{
				fs.rmdirSync(dirPath);
				resolve();				
			});
			exists.then(()=>{
				let files: string[] = fs.readdirSync(dirPath);
				let promises: Promise<void>[] = [];
				// Iterate over each file or folder in this folder
				for (let i = 0; i < files.length; i++) {
					// Get the path of the current file or folder
					let curPath = path.join(dirPath, files[i]);
	
					// Check if it is a folder
					if (fs.lstatSync(curPath).isDirectory()) { // recursion
						// Delete folder
						promises.push(this.deleteFolder(curPath));
					} else { // Delete file
						promises.push(this.deleteFile(curPath));
					}
				}
	
				Promise.all<void>(promises).then(()=>{
					// Now it's safe to delete folder without ENOTEMPTY
					fs.rmdirSync(dirPath);
					resolve();
				}).catch((err)=>{
					reject(err);
				});
			});
		});
	}

	/**
     * Checks if a folder exists, and if not, create it
     * by all means
     * @param {string} dir Folder to ensure exists
     * @return {boolean} Whether or not it was possible to
     *                   ensure existance.
	 * @returns {Promise<void>} Fires when the operation has been completed
     */
	public ensureFolderExists(dir:string): Promise<void> {
		dir = path.resolve(dir);
		return new Promise<void>((resolve: () => void, reject:(reason: string)=> void) => {			
			// If the folder exists or folder is undefined
			// then we say that we have ensured that the
			// folder exists
			let exists = this.exists(dir).then(()=> {
				resolve();
			}).catch(()=>{
				// Split the path by the OS seperator
				let splitDir: string[] = dir.split(path.sep);
				// Pop to get the last element of splitDir and remove it
				let folderToCreate: string = splitDir.pop() || "";
				// Create the path to the folder above this one
				let newDir: string = splitDir.join(path.sep);

				// Ensure that the folder above this exists
				this.ensureFolderExists(newDir).then(()=>{
					// Create the folder
					this.createFolder(path.join(newDir, folderToCreate)).then(()=>{
						resolve();
					});				
				}).catch(()=>{
					reject("Folder could not be created");
				});
			});
		});
	}

	/**
	 * Renames (moves) a file or folder
	 * @param {string} filePath Path to file or folder
	 * @param {string} newName The new path to file or folder
	 * @returns {Promise<void>} Fires when the operation has been completed
	 */
	public rename(filePath: string, newName: string): Promise<void>{
		return new Promise<void>((resolve: () => void, reject:(reason: string)=> void) => {
			fs.rename(filePath, newName, (err: string) => {
				if(err){
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	/**
	 * Creates a folder
	 * @param {string} path Path to the folder to create
	 * @returns {Promise<void>} Fires when the operation has been completed
	 */
	public createFolder(path: string): Promise<void> {
		return new Promise<void>((resolve: () => void, reject:(reason: string)=> void) => {
			fs.mkdir(path, (err: string) => {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	/**
	 * Checks if a thing in the filesystem exists
	 * @param {string} path Path to thing to check if exists
	 * @returns {Promise<void>} Fires when the operation has been completed
	 */
	public exists(path: string): Promise<void> {
		return new Promise<void>((resolve: () => void, reject:(reason: string) => void) => {
			fs.access(path, fs.constants.R_OK | fs.constants.W_OK, (err: string) => {
				if(err){
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	/**
	 * Provides a quick preview of the file in string format
	 * @param  {string} pathToFile   self explainatory
	 * @param  {int} 	bufferLength length of the buffer which stores the file
	 * @return {Promise<string>}     Provides the file preview when the operation is complete
	 */
	public filePreview(pathToFile: string, bufferLength?: number): Promise<string> {
		// Overload methods are overrated
		bufferLength = bufferLength || 100;

		// Create buffer to store characters
		let buffer: Buffer = new Buffer(new Array(bufferLength));

		return new Promise<string>(
				(resolve: (value:string) => void, reject:(reason: string)=> void) => {
			// Open file
			let fd: any = fs.openSync(pathToFile, 'r');
	
			// Read our preview
			fs.readSync(fd, buffer, 0, bufferLength, 0);
	
			// Close file (VERY IMPORTANT!)
			fs.closeSync(fd);
	
			// return preview without newlines
			resolve(String(buffer).replace(/\n/gm, " ").replace(/\0/g, ''));
		});
	}

	/**
	 * Watches directory for any changes made
	 * @param dirPath Directory to watch
	 */
	public watchDir(dirPath: string): Promise<IIOWatcher> {
		return new Promise<IIOWatcher>((resolve:(val:IIOWatcher)=>void, reject:(err:string)=>void)=>{
			let watcher:IIOWatcher = new IOWatcher();
			watcher.watch(dirPath, true).then(()=>{
				resolve(watcher);
			}).catch((err)=>{
				reject(err);
			});
		});
	}


	/**
	 * Get file stats from file system
	 * @param {string} filePath Path to file
	 * @return {Promise<any>} File stats
	 */
	public fileStats(filePath: string): Promise<any> {
		return new Promise<any>(
			(resolve: (value:any) => void, reject:(reason: string)=> void) => {
				fs.stat(filePath, (err, stats) => {
					if(err){
						reject(err);
						return;
					}
					resolve(stats);
				});
			});
	}

	/**
     * Creates notable file object from path
     * @param {string} filePath Path to the file to be created
	 * @returns {Promise<NotableFile>} Notable file from promise
     */
	public fileFromPath(filePath: string, stats?: any): Promise<NotableFile> {
		// Construct file
		let file: NotableFile = <NotableFile>{
			name: filePath,
			extension: (path.extname(filePath)) ? path.extname(filePath) :
				(filePath.substring(0, 4) == ".git") ? '.git' : '.default',
			stat: stats ? stats : false,
			open: false,
			childrens: 0,
			preview: "",
		};
		return new Promise<NotableFile>(
			(resolve: (value:NotableFile) => void, reject:(reason: string)=> void) => {
			this.fileStats(filePath).then((stats)=>{
				file.stat = stats;

				// Directories don't have previews		
				if(file.stat.isDirectory()){
					this.filesInDirectory(filePath).then((files:NotableFile[]) => {
						file.childrens = files.length;
						resolve(file);
						return;
					});
				} else {
					if(path.extname(filePath) != '.png'){
						this.filePreview(filePath).then((preview:string) => {
							file.preview = preview;
							resolve(file);
						});
					} else {
						file.preview = "";
						resolve(file);
					}
				}
			});
		});
	}

	/**
	 * Gets all files in a specific directory
	 * @param dirPath 		Path to the directory
	 * @param acceptedfiles Filter files
	 * @returns {Promise<NotableFile[]>} Array with notable files
	 */
	public filesInDirectory(dirPath: string): Promise<NotableFile[]>;
	public filesInDirectory(dirPath: string, acceptedfiles?: string[]): Promise<NotableFile[]> {
		return new Promise<any>(
			(resolve: (value:NotableFile[]) => void, reject:(reason: string)=> void) => {
				fs.readdir(dirPath, (err:string, files:string[])=>{
					let tree: NotableFile[] = [];
					let folders: NotableFile[] = [];
					let promises: Promise<NotableFile>[] = [];

					for (let i: number = 0; i <= (files.length - 1); i++) {
						let filePath: string = path.join(dirPath, files[i]);
						promises.push(this.fileFromPath(filePath));
					}

					Promise.all(promises).then((NotaFiles:NotableFile[]) => {
						for(let i:number = 0; i < NotaFiles.length; i++){
							let file = NotaFiles[i];

							if (file.stat.isDirectory()) {
								folders.push(file);
				
							} else if ((!acceptedfiles || acceptedfiles.length == 0) ||
								acceptedfiles.indexOf(file.extension) != -1) {
								tree.push(file);
							}
						}

						Array.prototype.unshift.apply(tree, folders);
						resolve(tree);
					});
				});
			});
	}

	/**
	 * Handles some promises with T1 of void
	 * @param err Error provided
	 * @param resolve Resolve function
	 * @param reject Reject function
	 */
	private callackVoidResolve(err: string, resolve: () => void, reject:(reason: string)=> void): void {
		if(err){
			reject(err);
			return;
		}
		resolve();
	}
}