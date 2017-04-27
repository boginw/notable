/* Includes */
const fs = require('fs');
const {remote, ipcRenderer, desktopCapturer, screen, webFrame} = require('electron')
const {Menu, MenuItem, app, shell, BrowserWindow, dialog} = remote;
const vex = require('vex-js');
const path = require('path');
const katex = require('katex');
const Vue = require('vue/dist/vue.js');
const diff_match_patch = require('googlediff');
const request = require("request")
window.hljs = require('highlightjs');

// Custom modules
const zoomFactor = require("../modules/application/zoomFactor/zoomFactor.js")();
const file = require('../modules/application/file/file.js')();

let rootDir = app.getPath('documents')+"/";
document.__dirname = __dirname;

vex.registerPlugin(require('vex-dialog'));
vex.defaultOptions.className = 'vex-theme-os';

Vue.component('projectExplorer', require('../modules/application/projectExplorer/projectExplorerVue.js'));
Vue.component('scrnsht',         require('../modules/application/screenshot/screenshotVue.js'));
Vue.component('wbuttons',        require('../modules/application/windowButtons/windowButtonsVue.js'));

let store = {
	SimpleMDE: require('simplemde'),
	document: document,
	BrowserWindow: BrowserWindow,
	remote: remote,
	pathd: path,
	path : rootDir+'notes',
	filetree: [],
	isWindows: true,
	md: false,
	defaultFile: rootDir+"notes/init.md",
	saveIntervals: null,
	shell:shell,
	rootDir:rootDir,
	openedFile:undefined,
	unsaved:true,
	supressChange: false,
	dmp: new diff_match_patch(),
	tempOld: null,
	search: "",
	acceptedfiles : [
		".md",
		".png"
	]
};

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
			renderingConfig: {
				codeSyntaxHighlighting: true,
			}
		});

		this.loadModules();

		this.md.codemirror.on('change', editor => {
			if(!this.supressChange){
				this.unsaved = true;
				clearTimeout(this.saveIntervals);
				this.saveIntervals = setTimeout(()=>{
					this.saveCurrentFile();
					var patches = this.dmp.patch_make(this.tempOld,this.md.value());
					// this is for later
					/*if(patches){
						request({ 
							url: "http://laraveladventure.dev/api/notes/1/changes", 
							method: 'PUT', 
							json: {changes: patches.toString()}
						}, ()=>{
							this.tempOld = this.md.value();
						});
					}*/
				},1500);
			}else{
				this.unsaved = false;
				this.supressChange = !this.supressChange;
			}
		});

		this.md.toolbarElements.guide.outerHTML = "";
		this.md.value(this.openFile(this.defaultFile));
		document.md = this.md;
	},
	computed:{
		currentOpenFile(){
			return path.basename(this.defaultFile);
		}
	},
	methods:{
		loadModules(){
			// Get the path to the modules/editor folder
			let editorModulesFolder = path.join(document.__dirname,"../modules/editor");
			// Get all folders in modules/editor
			let folders = fs.readdirSync(editorModulesFolder)
				.filter(file => fs.statSync(path.join(editorModulesFolder, file)).isDirectory())
			// Store modules inside md
			this.md.modules = [];

			console.log("Modules found: ",folders);
			
			for(var i=0; i < folders.length; i++){
				// Get path to main js file
				let pathToModule = path.join(editorModulesFolder,folders[i],folders[i]+".js");
				
				// Instantiate and store module 
				this.md.modules.push(
					require(pathToModule)(this.document,this.md)
				);
			}

			// Overwrite previewRender
			this.md.options.previewRender = (plaintext)=>{
				// Directory placeholder
				
				for(var i=0; i < this.md.modules.length; i++){
					// All modules have a preview function, to render
					// their their function to the preview view.
					plaintext = this.md.modules[i].preview(plaintext);
				}

				// Parse the rest through markdown
				return this.md.markdown(plaintext);
			};
		},
		savePDF(){
			// If editor isn't in preview mode, then put it in preview mode
			if(!(wasPreview = this.md.isPreviewActive())){
				this.md.togglePreview();
			}

			// If editor isn't in fullscreen mode, then put it in fullscreen mode
			if(!(wasFullScreen = this.md.isFullscreenActive())){
				this.md.toggleFullScreen();
			}

			// Toggle back if necessary
			if(!wasPreview) this.md.togglePreview();
			if(!wasFullScreen) this.md.toggleFullScreen();

			setTimeout(()=>{
				var d = document.createElement("div");
				d.className = "printToPDF editor-preview editor-preview-active";
				d.style.position = "initial";
				d.innerHTML = this.md.options.previewRender(this.md.value());
				document.body.appendChild(d);

				document.querySelector(".contents").style.display = "none";

				remote.getCurrentWindow().webContents.printToPDF({marginsType: 8, pageSize:"A4"}, (error, data) => {
					document.querySelector(".contents").style.display = "flex";
					document.querySelector(".printToPDF.editor-preview.editor-preview-active").outerHTML = "";

					setTimeout(()=>{
						if (error) throw error;
						var filter = [{name:"PDF",extensions: ["pdf"]}];

						dialog.showSaveDialog({title: "Save PDF", filters: filter}, (filename)=>{
							fs.writeFile(filename, data, (error) => {
								if (error) throw error;
								console.log('Write PDF successfully.');
							});
						});
					},10);
				});
			},250);
		},
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
				this.tempOld = this.md.value();
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
