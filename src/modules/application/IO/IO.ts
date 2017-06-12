let fs = require('fs');
let path = require('path');

export default class IO{
	/**
	 * Opens file and gets its contents
	 * @param {string}  fileName File to open
	 * @return {strnig} File contents
	 */
	openFile(fileName:string):string{
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
	saveFile(path:string, contents:string):void{
		fs.writeFile(path, contents, function(err) {
		    if(err) {
		        throw err;
		    }
		});
	}
	
	/**
	 * [filePreview description]
	 * @param  {string} pathToFile   self explainatory
	 * @param  {int} 	bufferLength length of the buffer which stores the file
	 * @return {string}              file preview
	 */
	filePreview(pathToFile:string);
	filePreview(pathToFile:string, bufferLength?:number):string{
		// Overload methods are overrated
		bufferLength = bufferLength || 100;
		
		// Create buffer to store characters
		let buffer:Buffer = new Buffer(new Array(bufferLength));

		// Open file
		let fd:any = fs.openSync(pathToFile, 'r');

		// Read our preview
		fs.readSync(fd, buffer, 3, bufferLength - 5, 0);

		// return preview without newlines
		return String(buffer).replace(/\n/gm," ");
	}

	/**
	 * Gets all files in a specific directory
	 * @param dirPath 		Path to the directory
	 * @param acceptedfiles Filter files
	 */
	filesInDirectory(dirPath:string):file[];
	filesInDirectory(dirPath:string, acceptedfiles?:string[]):file[]{
		let files:string[] = fs.readdirSync(dirPath);
		let tree = [];
		let folders = [];

		for(var i:number = 0; i <= (files.length-1); i++){
			let filePath:string = path.join(dirPath, files[i]);
			let file:file = <file>{
				name: files[i],
				extension: (path.extname(files[i])) ? path.extname(files[i]) : 
					(files[i].substring(0, 4) == ".git") ? '.git' :'.default',
				stat: fs.statSync(filePath),
				open: false,
				childrens: [],
				preview: null
			}

			if(file.stat.isDirectory()){
				folders.push(file);

			}else if((!acceptedfiles || acceptedfiles.length == 0) || acceptedfiles.indexOf(file.extension) != -1){
				file.preview = path.extname(files[i]) == '.png' ? "" : this.filePreview(filePath);
				tree.push(file);
			}
		}

		Array.prototype.unshift.apply(tree, folders);
		return tree;
	}
}