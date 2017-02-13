module.exports = function(){
	let fs = require('fs');
	let returns = {};

	returns.openFile = function(fileName){
		try {
			let access = fs.accessSync(fileName,fs.F_OK);
			let file = fs.readFileSync(fileName);
			return file.toString();
		} catch (e) {
			return "Failed to open file";
		}
		return null;
	}

	returns.saveFile = function(path,contents){
		fs.writeFile(path,contents, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		    console.log("The file was saved! "+path);
		});
	}

	return returns;
}