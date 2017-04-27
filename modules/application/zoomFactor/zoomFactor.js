let cp = require('child_process');
let {webFrame} = require('electron')

module.exports = function(){
	if(process.platform == "linux"){
		cp = require('child_process');
		var distroRegExp = /NAME="([A-z]+)"/gm;
		var releaseString = eval("String.fromCharCode("+cp.execSync("cat /etc/*-release").join(",")+")");
		var distro = distroRegExp.exec(releaseString);
		if(distro.length && distro[1] == "Ubuntu"){
			var scalingArray = cp.execSync("gsettings get org.gnome.desktop.interface text-scaling-factor");
			var scaling = Number.parseFloat(eval("String.fromCharCode("+scalingArray.join(",")+")"));
			webFrame.setZoomFactor(scaling);
			console.log(`You're running Linux (${distro[1]}) \
						 with text-scaling-factor set to ${scaling}\
						 So we've scaled the Window to the same scaling.`);
		}
	}
}