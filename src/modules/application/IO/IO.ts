let fs = require('fs');
let path = require('path');
let watch = require('watch');

import {
	NotableFile
} from '../../../interfaces';

export default class IO{
	/**
	 * Opens file and gets its contents
	 * @param {string}  fileName File to open
	 * @return {strnig} File contents
	 */
	public openFile(fileName:string):string{
		// Try to open the file, if fails, just return empty string
		try {
			// Do we have access?
			let access:any = fs.accessSync(fileName,fs.F_OK);
			// Open the file
			let file:any = fs.readFileSync(fileName);
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
	public saveFile(path:string, contents:string):void{
		fs.writeFile(path, contents, function(err:string) {
		    if(err) {
		        throw err;
		    }
		});
	}

	public deleteFile(path:string):void{
		fs.unlinkSync(path);
	}

	public rename(filePath:string, newName:string){
		fs.renameSync(filePath, newName);
	}

	/**
	 * Creates a folder
	 * @param path Path to the folder to create
	 */
	public createFolder(path:string):void{
		fs.mkdirSync(path);
	}

	/**
	 * Checks if a thing in the filesystem exists
	 * @param {string} path Path to thing to check if exists
	 */
	public exists(path:string):boolean{
		return fs.existsSync(path);
	}
	
	/**
	 * [filePreview description]
	 * @param  {string} pathToFile   self explainatory
	 * @param  {int} 	bufferLength length of the buffer which stores the file
	 * @return {string}              file preview
	 */
	public filePreview(pathToFile:string):string;
	public filePreview(pathToFile:string, bufferLength?:number):string{
		// Overload methods are overrated
		bufferLength = bufferLength || 100;
		
		// Create buffer to store characters
		let buffer:Buffer = new Buffer(new Array(bufferLength));

		// Open file
		let fd:any = fs.openSync(pathToFile, 'r');

		// Read our preview
		fs.readSync(fd, buffer, 3, bufferLength - 5, 0);

		// return preview without newlines
		return String(buffer).replace(/\n/gm," ").replace(/\0/g,'');
	}

	public watchDirectory(dirPath:string, callback:(f:any, curr:any, prev:any) => any):void{
		watch.watchTree(dirPath, callback);
	}

	/**
	 * Leave this directory alone!
	 * @param {string} dirPath Directory path
	 */
	public unwatchDirectory(dirPath:string):void{
		watch.unwatchTree(dirPath);
	}

	/**
	 * Get file stats from file system
	 * @param {string} filePath Path to file
	 * @return {any} File stats
	 */
	public fileStats(filePath:string):any{
		return fs.statSync(filePath);
	}

	/**
     * Creates file from path
     * @param {string} filePath Path to the file to be created
     */
    public fileFromPath(filePath:string, stats?:any):NotableFile{
        // Construct file
        let file:NotableFile = <NotableFile>{
            name: filePath,
            extension: (path.extname(filePath)) ? path.extname(filePath) : 
                (filePath.substring(0, 4) == ".git") ? '.git' :'.default',
            stat: stats ? stats : this.fileStats(filePath),
            open: false,
            childrens: [],
            preview: "",
        }

        // Directories don't have previews
        if(file.stat.isDirectory()){
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
	public filesInDirectory(dirPath:string):NotableFile[];
	public filesInDirectory(dirPath:string, acceptedfiles?:string[]):NotableFile[]{
		let files:string[] = fs.readdirSync(dirPath);
		let tree:NotableFile[] = [];
		let folders:NotableFile[] = [];

		for(var i:number = 0; i <= (files.length-1); i++){
			let filePath:string = path.join(dirPath, files[i]);
			let file:NotableFile = this.fileFromPath(filePath);

			if(file.stat.isDirectory()){
				folders.push(file);

			}else if((!acceptedfiles || acceptedfiles.length == 0) || 
					acceptedfiles.indexOf(file.extension) != -1){
				tree.push(file);
			}
		}

		Array.prototype.unshift.apply(tree, folders);
		return tree;
	}
}