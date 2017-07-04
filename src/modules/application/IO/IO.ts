let fs = require('fs');
let path = require('path');
let watch = require('watch');

import {
	NotableFile
} from '../../../interfaces';

export default class IO {
	/**
	 * Opens file and gets its contents
	 * @param {string}  fileName File to open
	 * @return {strnig} File contents
	 */
	public static openFile(fileName: string): string {
		// Try to open the file, if fails, just return empty string
		try {
			// Do we have access?
			let access: any = fs.accessSync(fileName, fs.F_OK);
			// Open the file
			let file: any = fs.readFileSync(fileName);
			return file.toString();
		} catch (e) {
			return "";
		}
	}

	/**
	 * Saves contents to file
	 * @param {string} path Path to file
	 * @param {string} contents Contents to be written to the file 
	 */
	public static saveFile(path: string, contents: string, callback?: (contents: string) => void): void {
		fs.writeFile(path, contents, function (err: string) {
			if (err) {
				throw err;
			}
			if(callback != undefined){
				callback(contents);
			}
		});
	}

	/**
	 * Deletes a file
	 * @param {string} path File to delete
	 */
	public static deleteFile(path: string): void {
		fs.unlinkSync(path);
	}

	/**
	 * Recursively deletes a folder (DO NOT USE OUTSIDE NOTE ENVIROMENT!)
	 * @param {string} dirPath Folder to delete
	 */
	public static deleteFolder(dirPath: string): void {
		if (this.exists(dirPath)) {
			let files: string[] = fs.readdirSync(dirPath);
			
			// Iterate over each file or folder in this folder
			for (let i = 0; i < files.length; i++) {
				// Get the path of the current file or folder
				let curPath = path.join(dirPath, files[i]);

				// Check if it is a folder
				if (fs.lstatSync(curPath).isDirectory()) { // recurse
					// Delete folder
					this.deleteFolder(curPath);
				} else { // Delete file
					this.deleteFile(curPath);
				}
			}

			// Now it's safe to delete folder without ENOTEMPTY
			fs.rmdirSync(dirPath);
		}
	}

	/**
     * Checks if a folder exists, and if not, create it
     * by all means
     * @param {string} dir Folder to ensure exists
     * @return {boolean} Whether or not it was possible to
     *                   ensure existance.
     */
	public static ensureFolderExists(dir:string): boolean {
		dir = path.resolve(dir);

		// If the folder exists or folder is undefined
		// then we say that we have ensured that the
		// folder exists
		if (this.exists(dir) || !dir) {
			return true;
		}

		// Split the path by the OS seperator
		let splitDir: string[] = dir.split(path.sep);
		// Pop to get the last element of splitDir and remove it
		let folderToCreate: string = splitDir.pop() || "";
		// Create the path to the folder above this one
		let newDir: string = splitDir.join(path.sep);

		// Ensure that the folder above this exists
		if (this.ensureFolderExists(newDir)) {
			// Create the folder
			this.createFolder(path.join(newDir, folderToCreate));
			return true;
		}
		// Folder could not be created
		return false;
	}

	/**
	 * Renames (moves) a file or folder
	 * @param {string} filePath Path to file or folder
	 * @param {string} newName The new path to file or folder
	 */
	public static rename(filePath: string, newName: string) {
		fs.renameSync(filePath, newName);
	}

	/**
	 * Creates a folder
	 * @param {string} path Path to the folder to create
	 */
	public static createFolder(path: string): void {
		fs.mkdirSync(path);
	}

	/**
	 * Checks if a thing in the filesystem exists
	 * @param {string} path Path to thing to check if exists
	 */
	public static exists(path: string): boolean {
		return fs.existsSync(path);
	}

	/**
	 * [filePreview description]
	 * @param  {string} pathToFile   self explainatory
	 * @param  {int} 	bufferLength length of the buffer which stores the file
	 * @return {string}              file preview
	 */
	public static filePreview(pathToFile: string, bufferLength?: number): string {
		// Overload methods are overrated
		bufferLength = bufferLength || 100;

		// Create buffer to store characters
		let buffer: Buffer = new Buffer(new Array(bufferLength));

		// Open file
		let fd: any = fs.openSync(pathToFile, 'r');

		// Read our preview
		fs.readSync(fd, buffer, 0, bufferLength, 0);

		// Close file (VERY IMPORTANT!)
		fs.closeSync(fd);

		// return preview without newlines
		return String(buffer).replace(/\n/gm, " ").replace(/\0/g, '');
	}

	/**
	 * Watches directory for any changes made
	 * @param dirPath Directory to watch
	 * @param callback A callback method which will be called
	 * every time there's a change
	 */
	public static watchDirectory(dirPath: string, callback: (f: any, curr: any, prev: any) => any): void {
		watch.watchTree(dirPath, callback);
	}

	/**
	 * Leave this directory alone!
	 * @param {string} dirPath Directory path
	 */
	public static unwatchDirectory(dirPath: string): void {
		watch.unwatchTree(dirPath);
	}

	/**
	 * Get file stats from file system
	 * @param {string} filePath Path to file
	 * @return {any} File stats
	 */
	public static fileStats(filePath: string): any {
		return fs.statSync(filePath);
	}

	/**
     * Creates file from path
     * @param {string} filePath Path to the file to be created
     */
	public static fileFromPath(filePath: string, stats?: any): NotableFile {
		// Construct file
		let file: NotableFile = <NotableFile>{
			name: filePath,
			extension: (path.extname(filePath)) ? path.extname(filePath) :
				(filePath.substring(0, 4) == ".git") ? '.git' : '.default',
			stat: stats ? stats : this.fileStats(filePath),
			open: false,
			childrens: 0,
			preview: "",
		};

		// Directories don't have previews
		if (file.stat.isDirectory()) {
			file.childrens = IO.filesInDirectory(filePath).length;
			return file;
		}

		// Get file preview if the file isn't png
		file.preview = path.extname(filePath) == '.png' ?
			"" : this.filePreview(filePath);

		return file;
	}

	/**
	 * Gets all files in a specific directory
	 * @param dirPath 		Path to the directory
	 * @param acceptedfiles Filter files
	 */
	public static filesInDirectory(dirPath: string): NotableFile[];
	public static filesInDirectory(dirPath: string, acceptedfiles?: string[]): NotableFile[] {
		let files: string[] = fs.readdirSync(dirPath);
		let tree: NotableFile[] = [];
		let folders: NotableFile[] = [];

		for (let i: number = 0; i <= (files.length - 1); i++) {
			let filePath: string = path.join(dirPath, files[i]);
			let file: NotableFile = this.fileFromPath(filePath);

			if (file.stat.isDirectory()) {
				folders.push(file);

			} else if ((!acceptedfiles || acceptedfiles.length == 0) ||
				acceptedfiles.indexOf(file.extension) != -1) {
				tree.push(file);
			}
		}

		Array.prototype.unshift.apply(tree, folders);
		return tree;
	}
}