module.exports = function(){
	let fs = require('fs');
	let path = require('path');
	let returns = {};

	this.openFile = function(fileName){
		try {
			let access = fs.accessSync(fileName,fs.F_OK);
			let file = fs.readFileSync(fileName);
			return file.toString();
		} catch (e) {
			return "";
		}
		return null;
	};

	this.saveFile = function(path,contents){
		fs.writeFile(path,contents, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		});
	};
	
	/**
	 * [filePreview description]
	 * @param  {string} pathToFile   self explainatory
	 * @param  {int} 	bufferLength length of the buffer which stores the file
	 * @return {string}              file preview
	 */
	this.filePreview = function(pathToFile, bufferLength){
		// Overload methods are overrated
		bufferLength = bufferLength || 100;
		
		// Create buffer to store characters
		let buffer = new Buffer(new Array(bufferLength));

		// Open file
		let fd = fs.openSync(pathToFile, 'r');

		// Read our preview
		fs.readSync(fd, buffer, 3, bufferLength - 5, 0);

		// return preview without newlines
		return String(buffer).replace(/\n/gm," ");
	};

	this.filesInDirectory = function(dirPath, acceptedfiles){
		let files = fs.readdirSync(dirPath);
		let tree = [];
		let folders = [];

		for(i=0; i <= (files.length-1); i++){
			let filePath = path.join(dirPath, files[i]);
			let file = {
				'name': files[i],
				'extension': (path.extname(files[i])) ? path.extname(files[i]) : 
					(files[i].substring(0, 4) == ".git") ? '.git' :'.default',
				'stat': fs.statSync(filePath),
				'open': false,
				'childrens': []
			}

			if(file.stat.isDirectory()){
				try {
					file.noteBook = JSON.parse(fileComp.openFile(path.join(dirPath,file.name,"folder.json")));
				} catch(e) {
					file.noteBook = {style:{}};
				}

				folders.push(file);
			}else if((!acceptedfiles || acceptedfiles.length == 0) || acceptedfiles.indexOf(file.extension) != -1){
				file.preview = path.extname(files[i]) == '.png' ? "" : this.filePreview(filePath);
				tree.push(file);
			}
		}
		Array.prototype.unshift.apply(tree, folders);
		return tree;
	};

	return this;
}