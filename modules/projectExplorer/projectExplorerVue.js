module.exports = ({
	props:['document','path','acceptedfiles','shell','search'],
	created(){
		// if this is root
		this.filetree = this.getDirectoriesInPath(this.path);
		setTimeout(()=>{
			this.updateTree();	
		},50);
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
						:class="{open : isOpenedFile(file)}"
					>
						<span 
							v-bind:class="{ folderName: file.isFolder, fileName: !file.isFolder }" 
						>
							<div 
								class="title"
								@click="open(file)"
								@contextmenu="rightClick(file, $event)"
								@dblclick.native="alert('rename')"
							>
								<i 
									v-if="file.isFolder"
									v-bind:class="file.open ? 'mi-keyboard-arrow-down':'mi-keyboard-arrow-right'"
									class="mi "
								></i>

								<i v-if="!file.isFolder" class="mi">v</i>
								<i 
									v-if="!file.isFolder"
									v-bind:class="file.extension == '.png' ? 'mi-image' : 'mi-insert-drive-file'"
									class="mi "
								></i>

								<i 
									v-else
									v-bind:class="file.open ? 'mi-folder-open' : 'mi-folder'"
									class="mi"
								></i>

							<span class="titleText">{{ filedisplayname(file) }}</span>
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
		filedisplayname(file){
			return file.isFolder ? file.name : file.name.substr(0,file.name.length-file.extension.length);
		},
		isOpenedFile(file){
			if(!document.explorerFrontend || !document.explorerFrontend.$data.defaultFile){
				return false;
			}else{
				return this.path +"/"+ file.name == document.explorerFrontend.defaultFile
			}
		},
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
			if(file === undefined) return;
			let filePath = file[0]+(file[1]? "/"+file[1].name: "");
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
			        	document.explorerFrontend.saveFile(filePath +"/"+ data.fileName, "");
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
		updateTree(){
			var tempTree = this.filetree;
			this.filetree = null;
			this.filetree = tempTree;
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

			this.currentRight = file || {empty:true};
			if(this.currentRight.isFolder){
				this.ProjectExplorerContext.folder.popup(remote.getCurrentWindow());
			}else{
				this.ProjectExplorerContext.file.popup(remote.getCurrentWindow());
			}
		},
		open(item){
			if(!item.isFolder){
				document.explorerFrontend.openFile(this.path+'/'+item.name);
				document.openedFile = item;
				this.updateTree();
			}else if(item.open==false){
				item.childrens = this.getDirectoriesInPath(this.path+'/'+item.name);
				item.open = true;
			}else{
				item.childrens = [];
				item.open = false;
			}
		},
		deleteFile(file){
			if(file === undefined) return;
			let filePath = file[0]+(file[1]? "/"+file[1].name: "");
			if(document.openedFile && document.openedFile.name == file[1].name){
				alert("Cannot delete opened file");
				return;
			}
			this.fs.unlinkSync(filePath);
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
				if(file[1] == false) console.trace();
				this.renameDialog(file, true);
			}

			r.delete = (initPath) => {
				this.deleteFile(initPath);
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
							this.folders().rename([this.path,this.currentRight]);
						}
					}, {
						type: 'separator',
					}, {
						label: 'New Folder',
						role: 'newFolder',
						click: (e)=>{
							this.folders().new([this.path,this.currentRight]);
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
							this.files().rename([this.path,this.currentRight]);
						}
					}, {
						label: 'Delete',
						role: 'deleteFile',
						click: ()=>{
							this.files().delete([this.path,this.currentRight]);
						}
					}, {
						type: 'separator',
					}, {
						label: 'Open Containing Folder',
						role: 'openfolder',
						click:()=>{
							console.log(this.path+"/"+this.currentRight.name);
							this.shell.showItemInFolder(this.path+this.pathd.sep+this.currentRight.name);
						}
					}
				])
			}
		};
	}
});