module.exports = function(){
	let fs = require('fs');
	let returns = {};

	returns.openFile = function(fileName){
		try {
			let access = fs.accessSync(fileName,fs.F_OK);
			let file = fs.readFileSync(fileName);
			return file.toString();
		} catch (e) {
			return "";
		}
		return null;
	}

	returns.saveFile = function(path,contents){
		fs.writeFile(path,contents, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		});
	}

	return returns;
}