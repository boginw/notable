module.exports = function(ipcRenderer, document, remote){
	let fs = require('fs'),
		path = require('path'),
		Vue = require('vue/dist/vue.js'),
		fileComp = require('../../modules/file/file.js')(),
		{Menu} = remote,
		returns = {};

	returns.acceptedFiles = [
		".md"
	];

	returns.filterFiles = function(file){
		return returns.acceptedFiles.indexOf(file.extension) != -1;
	}

	returns.getDirectoriesInPath = function(dirPath){
		let files = fs.readdirSync(dirPath);
		let tree = [];
        let folders = [];

		for(i=0; i <= (files.length-1); i++){
			let file = {
				'name': files[i],
				'extension': (path.extname(files[i])) ? path.extname(files[i]) : (files[i].substring(0, 4) == ".git") ? '.git' :'.default',
				'isFolder': (fs.statSync(path.join(dirPath, files[i])).isDirectory()) ? true : false,
				'open': false,
				'childrens': []
			}

            if(file.isFolder){
				try {
            		file.noteBook = JSON.parse(fileComp.openFile(dirPath+"/"+file.name+"/folder.json"));
				} catch(e) {
					file.noteBook = {style:{}};
				}

                folders.push(file);
            }else if(returns.filterFiles(file)){
			    tree.push(file);
            }

		}

        Array.prototype.unshift.apply(tree, folders);

		return tree;
	}

	returns.setDirectory = function(dirPath){
		let tree = returns.getDirectoriesInPath(dirPath);
		explorerFrontend._data.path = dirPath;
		explorerFrontend._data.filetree = tree;
	}

	Vue.component('projectExplorer', {
		created(){

		},
		template: `<ul>
						<li 
							v-for="file in filetree"
							v-bind:style="file.isFolder ? file.noteBook.style : {}"
							v-bind:draggable="!file.isFolder"
							@drop="drop_handler($event,file)"
							@dragover.prevent 
							@dragstart="dragstart_handler($event,file)"
							@dragenter.prevent="()=>true"
						>
							<span 
								v-bind:class="{ folderName: file.isFolder, fileName: !file.isFolder }" 
							>
								<div 
									class="title"
									@click="open(file)"
									@contextmenu="rightClick(file)"
								>
									<i 
										v-if="!file.isFolder"
										v-bind:class="'file_type_'+file.extension.substring(1)"
										class="file_icon"
									></i>

									<i 
										v-else
										class="mi mi-folder"
									></i>

								{{ file.name }}
								</div>
							</span>
							<project-explorer v-if="file.open" v-bind:path="path+'/'+file.name" v-bind:filetree="file.childrens"></project-explorer>
						</li>
					</ul>`,
	  	props: ['path','filetree'],
		methods:{
			dragstart_handler(event,file){
				if(file.isFolder){
					event.preventDefault();
					return false;
				}
				this.beingDraged = file;
				event.dataTransfer.setDragImage(event.target,0,0);
			},
			drop_handler(ev,file) {
				if(file.isFolder){
					console.log(this.path+this.beingDraged.name, this.path+file.name);
					document.rename(this.path+this.beingDraged.name, this.path+file.name+"/"+this.beingDraged.name);
				}
			},
			rightClick(file){
				currentRight = file;
				if(file.isFolder){
					this.ProjectExplorerContext.folder.popup(remote.getCurrentWindow());
				}else{
					this.ProjectExplorerContext.file.popup(remote.getCurrentWindow());
				}
			},
			open(item){
				if(!item.isFolder){
					document.openFile(this.path+'/'+item.name);
				}else if(item.open==false){
                    item.childrens = returns.getDirectoriesInPath(this.path+'/'+item.name);
					item.open = true;
				}else{
					item.childrens = [];
					item.open = false;
				}
			},
			folders(){
				let r = {};

				r.new = (folder) => {
					document.createFolderDialog(folder);
				}

				r.rename = (folder) => {
					document.renameFolderDialog(folder);
				}

				r.delete = (initPath) => {
					console.log("Delete this folder: "+initPath);
				}

				return r;
			},
			files(){
				let r = {};

				r.new = (file) => {
					document.createFileDialog(file);
				}

				r.rename = (file) => {
					document.renameFileDialog(file);
				}

				r.delete = (initPath) => {
					console.log("Delete this file: "+initPath);
				}

				return r;
			}
		},
		data: function(){
			return {
				currentRight: false,
				beingDraged: false,
				ProjectExplorerContext: {
					folder: Menu.buildFromTemplate([
						{
					        label: 'New Note',
					        role: 'new',
					    }, {
					        label: 'Rename',
					        role: 'rename',
					        click: ()=>{
					        	this.folders().rename([this.path,currentRight]);
					        }
					    }, {
					        type: 'separator',
					    }, {
					        label: 'New Folder',
					        role: 'newFolder',
					        click: (e)=>{
					        	this.folders().new([this.path,currentRight]);
					        }
					    }, {
					        label: 'Delete Folder',
					        role: 'delFolder',
					    }, {
					        type: 'separator',
					    }, {
					        label: 'Folder Properties',
					        role: 'propFolder',
					    }
					]),
					file: Menu.buildFromTemplate([
						{
					        label: 'Rename',
					        role: 'rename',
					        click: ()=>{
					        	this.files().rename([this.path,currentRight]);
					        }
					    }, {
					        label: 'Delete',
					        role: 'delete',
					        click: ()=>{
					        	console.log(this.files());
					        	this.files().delete([this.path,currentRight]);
					        }
					    }, {
					        type: 'separator',
					    }, {
					        label: 'Open Containing Folder',
					        role: 'openfolder',
					    }
					])
				}
			};
		}
	});

	let store = {
		path : './notes',
		filetree: [],
		isWindows: true
	};

	var explorerFrontend = new Vue({
		el: '.contents',
		data: store,
		methods:{
			getDate(){
				var today = new Date();
				var dd = today.getDate();
				var MM = today.getMonth()+1;
				var hh = today.getHours();
				var mm = today.getMinutes();
				var ss = today.getSeconds();

				var yyyy = today.getFullYear();
				if(dd<10){
				    dd='0'+dd;
				} 
				if(mm<10){
				    mm='0'+mm;
				} 
				var today = hh+'.'+mm+'.'+ss+'-'+dd+'-'+MM+'-'+yyyy;

				return today;
			},
			screenshot(){
				console.log("taking screenshot");
				remote.getCurrentWindow().hide();
				document.fullscreenScreenshot((dat)=>{

					var currentTime = this.getDate();
					// Create the browser window.
					screenshotWindow = new BrowserWindow({
						fullscreen: true,
						frame: false
					});

					// and load the index.html of the app.
					screenshotWindow.loadURL(
						require("url").format({
							pathname: require("path").join(document.__dirname, '/cropper.html'),
							protocol: 'file:',
							slashes: true
						})
					);

					screenshotWindow.webContents.on('did-finish-load', () => {
						screenshotWindow.webContents.send('store-data', "scr_"+currentTime+".png");
					});

					screenshotWindow.webContents.on('cropped', () => {
						document.md.value(document.md.value()+"\n![screenshot](../notes/scr_"+currentTime+".png)");
						remote.getCurrentWindow().show();

						screenshotWindow = null;
					});

					var base64Data = dat.replace(/^data:image\/png;base64,/, "");
					require("fs").writeFile("notes/scr_"+currentTime+".png", base64Data, 'base64', function(err) {
						console.log(err);
					});

				}, 'image/png');
			},
			handleClose() {
				if (this.isWindows) {
					remote.getCurrentWindow().close();
				} else {
					remote.getCurrentWindow().hide();
				}
			},
			handleMinimize() {
				remote.getCurrentWindow().minimize();
			},
			handleFullscreen: function () {
				if (this.isWindows) {
					if (remote.getCurrentWindow().isMaximized()) {
						remote.getCurrentWindow().unmaximize();
					} else {
						remote.getCurrentWindow().maximize();
					}

					this.setState({
						fullscreen: remote.getCurrentWindow().isMaximized()
					});
				} else {
					remote.getCurrentWindow().setFullScreen(!remote.getCurrentWindow().isFullScreen());
						this.setState({
						fullscreen: remote.getCurrentWindow().isFullScreen()
					});
				}
			},
		}
	});

	return returns;
}
