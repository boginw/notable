/* Includes */
const fs = require('fs');
const {remote, ipcRenderer, desktopCapturer, screen, webFrame} = require('electron')
const {Menu, MenuItem, app, shell, BrowserWindow, dialog} = remote;
const vex = require('vex-js');
const path = require('path');
const katex = require('katex');
const Vue = require('vue/dist/vue.js');

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

// Custom modules
const file 			  = require('../modules/file/file.js')();

let rootDir = app.getPath('documents')+"/";
document.__dirname = __dirname;
vex.registerPlugin(require('vex-dialog'));
vex.defaultOptions.className = 'vex-theme-os';
console.log(rootDir);

function hasClassName(needle, haystack){
	return !!haystack && haystack.split(" ").indexOf(needle) != -1;
}

function linkHandler(){
	console.log("called");
	var aTags = document.querySelectorAll("a[href]");
	var clickBack = function(e){
		console.log(e);
		e.preventDefault();
		shell.openExternal(e.target.href);
		return false;
	};

	for (var i = 0; i < aTags.length; i++) {
		aTags[i].removeEventListener("click", clickBack, false);
		aTags[i].addEventListener("click", clickBack);
	}
}

function init(){

}

init();

Vue.component('projectExplorer', require('../modules/projectExplorer/projectExplorerVue.js'));
Vue.component('scrnsht',         require('../modules/screenshot/screenshotVue.js'));
Vue.component('wbuttons',        require('../modules/windowButtons/windowButtonsVue.js'));

let store = {
	SimpleMDE: require('simplemde'),
	document: document,
	BrowserWindow: BrowserWindow,
	remote: remote,
	fs: fs,
	pathd: path,
	path : rootDir+'notes',
	filetree: [],
	isWindows: true,
	search: "",
	md: false,
	defaultFile: rootDir+"notes/init.md",
	saveIntervals: null,
	shell:shell,
	rootDir:rootDir,
	acceptedfiles : [
		".md",
		".png"
	],
	openedFile:undefined,
	unsaved:true,
	supressChange: false
};

document.widgets = [];

document.explorerFrontend = new Vue({
	el: '.contents',
	data: store,
	mounted(){
		this.md = new this.SimpleMDE({
			element: this.document.getElementById("editor"),
			spellChecker: false,
			shortcuts: {
				drawTable: "Cmd-Alt-T"
			},
			previewRender:(plaintext)=>{
				// Directory placeholder
				plaintext = plaintext.replace(/{DIR}/gm,this.path);

				// Math placeholder
				const regex = /\$\$?(.*?)\$?\$/g;
				while ((m = regex.exec(plaintext)) !== null) {
				    // This is necessary to avoid infinite loops with zero-width matches
				    if (m.index === regex.lastIndex) {
				        regex.lastIndex++;
				    }
				    try{
				    	console.log(m[1]);
				    	plaintext = plaintext.replace(m[0]+"", katex.renderToString(m[1].replace(/\$/gm,"")));
				    }catch(ignore){
				    	console.log(ignore);
				    }
				}

				return this.md.markdown(plaintext);
			}
		});

		this.md.cmi = require('../modules/codeMirrorImages/codeMirrorImages.js')(this.document,this.md, this.path);
		this.md.cmm = require('../modules/codeMirrorMath/codeMirrorMath.js')(this.document,this.md, this.path);
		this.md.codemirror.on('change', editor => {
			if(!this.supressChange){
				for (var i = 0; i < document.widgets.length; ++i){
		    		this.md.codemirror.removeLineWidget(document.widgets[i]);
			    }

			    document.widgets.length = 0;


				this.unsaved = true;
				this.md.cmi.checkForImage();
				this.md.cmm.checkForMath();
				clearTimeout(this.saveIntervals);
				this.saveIntervals = setTimeout(()=>{
					this.saveCurrentFile();
				},1500);
			}else{
				this.unsaved = false;
				this.supressChange = !this.supressChange;
			}
		});

		this.md.toolbarElements.guide.outerHTML = "";
		this.md.value(this.openFile(this.defaultFile));
		document.md = this.md;
		console.log(this.defaultFile);
	},
	computed:{

		currentOpenFile(){
			return path.basename(this.defaultFile);
		}
	},
	methods:{
		currentOpenFileExt(){
			return path.extname(this.defaultFile);
		},
		setOpenFile(file){
			this.openedFile = file;
		},
		getOpenFile(){
			return this.openedFile;
		},
		newFile(){
			this.defaultFile = false;
			this.md.value("");
		},
		rename(oldPath, newPath, callback){
			fs.rename(oldPath, newPath, function (err) {
				if (err) throw err;
				console.log('renamed complete');

				callback();
			});
		},
		saveCurrentFile(){
			this.unsaved = false;
			this.saveFile(this.defaultFile, this.md.value());
			this.md.cmi.checkForImage();
		},
		saveFile(path, contents){
			if(!path){
				let newPath = dialog.showSaveDialog({
					title: "Choose file",
					buttonLabel: "Save",
			        properties: ['openFile']
			    });

			    if(newPath != undefined){
			      	this.saveFile(newPath, contents);
			    }else{
			      alert("Could not save file");
			    }
			    return;
			}

			file.saveFile(path, contents);
			defaultFile = path;
		},
		openFile(path){
			if(this.pathd.extname(path) == '.png'){

			}else{
				this.supressChange = true;
				this.md.value(file.openFile(path));
			}

			this.defaultFile = path;
			console.log("opening file: "+path);
			document.title = "Notable.ink - " + __dirname + "\\." + path;
		},
		visit(url){
			shell.openExternal(url);
		},
		pop(text){
			alert(text);
		}
	}
});