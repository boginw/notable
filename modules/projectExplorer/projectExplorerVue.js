module.exports = ({
	props:['document','path','acceptedfiles','shell','search'],
	created(){
		// if this is root
		this.filetree = this.getDirectoriesInPath(this.path);
	},
	template: `<ul @contextmenu="rightClick(undefined, $event)">
					<li 
						v-for="file in filetreesearch"
						v-bind:style="file.isFolder ? file.noteBook.style : {}"
						v-bind:draggable="!file.isFolder"
						@drop="drop_handler($event,file)"
						@dragover.prevent 
						@dragstart="dragstart_handler($event,file)"
						@dragenter.prevent="()=>true"
						:class="{open : file==openedFile}"
					>
						<span 
							v-bind:class="{ folderName: file.isFolder, fileName: !file.isFolder }" 
						>
							<div 
								class="title"
								@click="open(file)"
								@contextmenu="rightClick(file, $event)"
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
						<project-explorer v-if="file.open" v-bind:search="search" v-bind:shell="shell" v-bind:document="document" v-bind:acceptedfiles="acceptedfiles" v-bind:path="path+'/'+file.name" v-bind:filetree="file.childrens"></project-explorer>
					</li>
				</ul>`,
	computed:{
		filetreesearch(){
			return this.filetree.filter((file)=>{
				if(this.search == ""){
					file.open = false;
					file.childrens = [];
					return true;
				}else{
					if(file.isFolder){
						if(!file.open){
							this.open(file);
						}
						return true;
					}
					return file.name.toLowerCase().indexOf(this.search.toLowerCase()) != -1;
				}
			});
		}
	},
	methods:{
		renameDialog(file, isFile){
			let filePath = file[0]+"/"+file[1].name;
			let fileOrFolder = !!isFile ? "file" : "folder";
			vex.dialog.open({
			    message: `Enter ${fileOrFolder} name:`,
			    input: [
			        `<input name="fileName" type="text" placeholder="${fileOrFolder} name" required value="${file[1].name}" />`
			    ].join(''),
			    callback: (data)=>{
			        if (!data) {
			            console.log('Cancelled');
			        } else {
			        	document.explorerFrontend.rename(filePath, file[0]+"/"+data.fileName,()=>{
			        		this.filetree = this.getDirectoriesInPath(this.path);
			        	});
			        }
			    }
			});
		},
		createFolderDialog(folder){
			let newPath;
			if(folder === undefined){
				newPath = path;
			}else{
				if(folder[1]){
					newPath = folder[0]+"/"+folder[1].name+"/";
				}else{
					newPath = folder[0]+"/";
				}
			}

			vex.dialog.open({
			    message: 'Enter folder name:',
			    input: [
			        '<input name="folderName" type="text" placeholder="Folder name" required />',
			        '<input name="folderBackground" type="color" value="#FFF" required />',
			        '<input name="folderColor" type="color" value="#000" required />',
			    ].join(''),
			    callback: (data)=>{
			        if (!data) {
			            console.log('Cancelled');
			        } else {
			        	console.log(newPath, data.folderName)
			        	this.createFolderProject(newPath + data.folderName, {
			        		backgroundColor: data.folderBackground,
			        		color: data.folderColor
			        	});
			        }
			    }
			});
		},
		createFileDialog(file){
			console.log(file);
			if(file === undefined) return;
			let filePath = file[0]+"/"+file[1].name;

			vex.dialog.open({
			    message: 'Enter file name:',
			    input: [
			        '<input name="fileName" type="text" placeholder="file name" required />'
			    ].join(''),
			    callback: (data)=>{
			        if (!data) {
			            console.log('Cancelled');
			        } else {
			        	console.log(filePath, data.fileName);
			        	document.explorerFrontend.saveFile(filePath + data.fileName, "");
			        	this.filetree = this.getDirectoriesInPath(this.path);
			        	this.open(filePath + data.fileName);
			        }
			    }
			});
		},
		createFolderProject(path, style){
			fs.mkdirSync(path);
			document.explorerFrontend.saveFile(path+"/folder.json",JSON.stringify({
				style: style,
				icon: false
			}));
			this.filetree = this.getDirectoriesInPath(this.path);
		},
		filterFiles(file){
			if(this.acceptedfiles == undefined){
				return false;
			}
			return this.acceptedfiles.indexOf(file.extension) != -1;
		},
		getDirectoriesInPath(dirPath){
			let files = fs.readdirSync(dirPath);
			let tree = [];
	        let folders = [];

			for(i=0; i <= (files.length-1); i++){
				let file = {
					'name': files[i],
					'extension': (this.pathd.extname(files[i])) ? this.pathd.extname(files[i]) : (files[i].substring(0, 4) == ".git") ? '.git' :'.default',
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
	            }else if(this.filterFiles(file)){
				    tree.push(file);
	            }

			}

	        Array.prototype.unshift.apply(tree, folders);

			return tree;
		},
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
				document.explorerFrontend.rename(this.path+"/"+this.beingDraged.name, this.path+"/"+file.name+"/"+this.beingDraged.name,()=>{
					this.filetree = this.getDirectoriesInPath(this.path);
				});
			}
		},
		rightClick(file, event){

			if(this.document.isRootRight == event){
				return;
			}
			this.document.isRootRight = event;

			if(event != undefined && event.target.tagName == "UL"){
				this.ProjectExplorerContext.empty.popup(remote.getCurrentWindow());
				return;
			}


			currentRight = file || {empty:true};
			if(currentRight.isFolder){
				this.ProjectExplorerContext.folder.popup(remote.getCurrentWindow());
			}else{
				this.ProjectExplorerContext.file.popup(remote.getCurrentWindow());
			}
		},
		open(item){
			if(!item.isFolder){
				document.explorerFrontend.openFile(this.path+'/'+item.name);
				//this.$emit("openFile",this.path+'/'+item.name);
				this.openedFile = item;
			}else if(item.open==false){
				//this.$emit("openDir",this.path+'/'+item.name);
				item.childrens = this.getDirectoriesInPath(this.path+'/'+item.name);
				item.open = true;
			}else{
				item.childrens = [];
				item.open = false;
			}
		},
		deleteFile(folder){
			let newPath;
			if(folder === undefined){
				newPath = path;
			}else{
				if(folder[1]){
					newPath = folder[0]+"/"+folder[1].name+"/";
				}else{
					newPath = folder[0]+"/";
				}
			}

			this.fs.unlinkSync(newPath);
			this.filetree = this.getDirectoriesInPath(this.path);
		},
		folders(){
			let r = {};

			r.new = (folder) => {
				this.createFolderDialog(folder);
			}

			r.rename = (folder) => {
				this.renameDialog(folder, false);
			}

			r.delete = (initPath) => {
				console.log("Delete this folder: "+initPath);
			}

			return r;
		},
		files(){
			let r = {};

			r.new = (file) => {

				if(file[1] == false) console.trace();
				this.createFileDialog(file);
			}

			r.rename = (file) => {
				this.renameDialog(file, true);
			}

			r.delete = (initPath) => {
				console.log("Delete this file: "+initPath);
				this.delete(initPath);
			}

			return r;
		}
	},
	data: function(){
		return {
			isRootRight: false,
			filetree:false,
			pathd: require("path"),
			fs: require("fs"),
			openedFile: false,
			currentRight: false,
			beingDraged: false,
			ProjectExplorerContext: {
				empty: Menu.buildFromTemplate([
					{
						label: 'New Note',
						role: 'new',
						click: (e)=>{
							this.files().new([this.path,this.currentRight]);
						}
					}, {
						type: 'separator',
					}, {
						label: 'New Folder',
						role: 'newFolder',
						click: (e)=>{
							this.folders().new([this.path,this.currentRight]);
						}
					}
				]),
				folder: Menu.buildFromTemplate([
					{
						label: 'New Note',
						role: 'new',
						click: ()=>{
							this.files().new([this.path,this.currentRight]);
						}
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
							console.log(this.deleteFile([this.path,currentRight]));
						}
					}, {
						type: 'separator',
					}, {
						label: 'Open Containing Folder',
						role: 'openfolder',
						click:()=>{
							this.shell.showItemInFolder(document.__dirname+"/."+this.path+"/"+currentRight.name)
						}
					}
				])
			}
		};
	}
});