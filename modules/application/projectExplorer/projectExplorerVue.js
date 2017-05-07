const ta = require('time-ago')();
const fileOp = require('../file/file.js')();
const showFilePreview = true;


module.exports = ({
	props:['document','rootdir','acceptedfiles','shell','search','sortalpha'],
	created(){
		this.path = this.rootdir;
	},
	template: `<ul @contextmenu="rightClick(undefined, $event)">
					<li
						v-for="file,i in filetreesearch"
						v-bind:style="file.stat.isDirectory() ? file.noteBook.style : {}"
						v-bind:draggable="!file.stat.isDirectory()"
						@drop="drop_handler($event,file)"
						@dragover.prevent 
						@dragstart="dragstart_handler($event,file)"
						@dragenter.prevent="()=>true"
						:class="{open : isOpenedFile(file)}"
					>
						<span 
							v-bind:class="{ folderName: file.stat.isDirectory(), fileName: !file.stat.isDirectory() }" 
						>
							<div 
								class="title"
								@click="open(file)"
								@contextmenu="rightClick(file, $event)"
								@dblclick.native="alert('rename')"
							>
								<i 
									v-if="!file.stat.isDirectory()"
									v-bind:class="file.extension == '.png' ? 'mi-image' : 'mi-insert-drive-file'"
									class="mi "
								></i>

								<i 
									v-else
									v-bind:class="file.open ? 'mi-folder-open' : 'mi-folder'"
									class="mi"
								></i>

								<span class="titleText">{{ fileDisplayName(file) }}</span>
								
								<div class="fileDetails" v-if="!file.stat.isDirectory()">
									<div class="lastMod">{{ lastModified(file.stat.mtime) }}</div>
									<div class="filePrev">{{ file.preview }}</div>
								</div>
							</div>
						</span>
					</li>
				</ul>`,
	computed:{
		/**
		 * Loads the fileTree for current folder,
		 * sorts it if needed, and fetches file
		 * preview, and filters it for search if
		 * necessary
		 * 
		 * @return {array} array of files
		 */
		filetreesearch(){
			// Get the files in current directory
			this.updateTree();
			
			// Sorting
			if(this.sortalpha){
				this.filetree = this.filetree.sort((a, b)=>{
					if(a.stat.isDirectory()){
						return -1;
					}
					return b.stat.mtime.getTime() - a.stat.mtime.getTime();
				});
			}else{
				this.filetree = this.filetree.sort();
			}

			// Fetch file previews
			this.filetree.forEach((file) => {
				// Don't fetch preview if folder, or preview is turnded off or this is an image
				if(file.stat.isDirectory() || !showFilePreview || file.extension == '.png'){
					return;
				}

				// Set the preview
				file.preview = fileOp.filePreview(this.pathToThis(file));
			});

			// Search filter
			return this.filetree.filter((file)=>{
				if(this.search == ""){
					file.open = false;
					file.childrens = [];
					return true;
				}else{
					return file.name.toLowerCase().indexOf(this.search.toLowerCase()) != -1;
				}
			});
		},
	},
	methods:{
		/**
		 * Strips extensions of files and leaves 
		 * directories alone
		 * 
		 * @param  {file} 	 file 	file from getDirectoriesInPath
		 * @return {string}	  	Filename without extension
		 */
		fileDisplayName(file){
			return file.stat.isDirectory() ? file.name : 
				file.name.substr(0,file.name.length-file.extension.length);
		},
		/**
		 * Returns easily readable dates relative to
		 * current date. Fx. 1 day ago, 3 weeks ago
		 * 
		 * @param  {string} dateString string that can be 
		 *							 formatted with Date
		 * @return {string}			Easily readable date 
		 *							 string
		 */
		lastModified(dateString){
			return ta.ago(new Date(dateString));
		},
		isOpenedFile(file){
			if(!store.defaultFile){
				return false;
			}else{
				return this.pathToThis(file.name) == store.defaultFile
			}
		},
		renameDialog(file, isFile){
			this.currentRight = false;
			let filePath = this.pathToThis(file);
			let fileOrFolder = !!isFile ? "file" : "folder";
			vex.dialog.open({
				message: `Enter ${fileOrFolder} name:`,
				input: [
					`<input name="fileName" type="text" placeholder="${fileOrFolder} name" required value="${file.name}" />`
				].join(''),
				callback: (data)=>{
					if (data){
						document.explorerFrontend.rename(filePath, this.pathToThis(data.fileName),()=>{
							this.updateTree(this.path);
						});
					}
				}
			});
		},
		createFolderDialog(folder){
			this.currentRight = false;
			let dirPath = this.pathToThis(folder);
			vex.dialog.open({
				message: 'Enter folder name:',
				input: [
					'<input name="folderName" type="text" placeholder="Folder name" required />',
					'<input name="folderBackground" type="color" value="#FFF" required />',
					'<input name="folderColor" type="color" value="#000" required />',
				].join(''),
				callback: (data)=>{
					if (data)  {
						this.createFolderProject(path.join(dirPath, data.folderName), {
							backgroundColor: data.folderBackground,
							color: data.folderColor
						});
					}
				}
			});
		},
		createFileDialog(file){
			this.currentRight = false;
			let filePath = this.pathToThis(file);

			vex.dialog.open({
				message: 'Enter file name:',
				input: [
					'<input name="fileName" type="text" placeholder="file name" required />'
				].join(''),
				callback: (data)=>{
					if (data){
						console.log(file,filePath,data);
						document.explorerFrontend.saveFile(path.join(filePath, data.fileName + ".md"), "");
						this.updateTree(this.path);
						//this.open(filePath + data.fileName);
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
			this.updateTree(this.path);
		},
		dragstart_handler(event,file){
			if(file.stat.isDirectory()){
				event.preventDefault();
				return false;
			}
			this.beingDraged = file;
			event.dataTransfer.setDragImage(event.target,0,0);
		},
		drop_handler(ev,file) {
			if(file.stat.isDirectory()){
				document.explorerFrontend.rename(this.path+"/"+this.beingDraged.name, this.path+"/"+file.name+"/"+this.beingDraged.name,()=>{
					this.updateTree(this.path);
				});
			}
		},
		updateTree(path){
			let pathToGoto = path ? path : this.pathToThis();
			this.filetree = fileOp.filesInDirectory(pathToGoto, this.acceptedfiles);
		},
		refreshTree(){
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

			this.currentRight = file || { empty: true };

			if(this.currentRight.stat.isDirectory()){
				this.ProjectExplorerContext.folder.popup(remote.getCurrentWindow());
			}else{
				this.ProjectExplorerContext.file.popup(remote.getCurrentWindow());
			}
		},
		open(item){
			if(!item.stat.isDirectory()){
				document.explorerFrontend.openFile(item.name);
				document.openedFile = item;
				this.refreshTree();
			}else if(item.open==false){
				store.foldertree.push(item.name);
				this.updateTree(this.path+'/'+item.name);
				item.open = true;
			}else{
				item.childrens = [];
				item.open = false;
			}
		},
		/**
		 * Finds the path to the given file or directory
		 * 
		 * @param  {string or file}   pathTo	thing to find the path to
		 * @return {string}						path to given thing
		 */
		pathToThis(pathTo){
			// if pathTo is set
			if(pathTo){
				// If pathTo is a file
				if(typeof(pathTo) != "string" && pathTo.name != undefined){
					pathTo = pathTo.name || "";
				}
			// Get path to current dir then
			}else{
				pathTo = "";
			}

			// TODO: this needs to be local
			return path.join(store.root,store.foldertree.join('/'),pathTo);
		},
		/**
		 * Search and DESTROY! deletes a file or
		 * folder
		 * 
		 * @param  {object} file 	file object to be deleted
		 *							eiher a folder or file
		 */
		deleteFile(file){
			// We need to delete something
			if(file === undefined) return;
			// Get path to something
			let dirPath = this.pathToThis(file);

			// Incase it is a directory, here's a recursive
			// folder deletion function
			let deleteFolderRecursive = function(path) {
				if( fs.existsSync(path) ) {
					fs.readdirSync(path).forEach(function(file,index){
						var curPath = path + "/" + file;
						if(fs.lstatSync(curPath).isDirectory()) { // recurse
							deleteFolderRecursive(curPath);
						} else { // delete file
							fs.unlinkSync(curPath);
						}
					});
					fs.rmdirSync(path);
				}
			};

			// Make user confirm the deletion
			vex.dialog.confirm({
				message: 'Are you absolutely sure you want to destroy the file or folder? This cannot be undone', 
				callback: (value) => {
					// User confirmed
					if (value) {
						// Delete directory
						if(file.stat.isDirectory()){
							deleteFolderRecursive(dirPath);
						// Delete file
						}else{
							this.fs.unlinkSync(dirPath);
						}
						// Reset filetree
						this.updateTree(this.path);
					}
				},
			});

			// Reset right click item
			this.currentRight = false;
		},
		folders(){
			let r = {};

			r.new = (e) => {
				this.createFolderDialog(this.currentRight);
			}

			r.rename = (e) => {
				this.renameDialog(this.currentRight, false);
			}

			r.delete = (e) => {
				this.deleteFile(this.currentRight);
			}

			return r;
		},
		files(){
			let r = {};

			r.new = (e) => {
				this.createFileDialog(this.currentRight);
			}

			r.rename = (e) => {
				this.renameDialog(this.currentRight, true);
			}

			r.delete = (e) => {
				this.deleteFile(this.currentRight);
			}

			return r;
		}
	},
	data: function(){
		return {
			isRootRight: false,
			filetree:false,
			fs: require("fs"),
			openedFile: false,
			currentRight: false,
			beingDraged: false,
			ProjectExplorerContext: {
				empty: Menu.buildFromTemplate([
					{
						label: 'New Note',
						role: 'new',
						click: this.files().new,
					}, {
						type: 'separator',
					}, {
						label: 'New Folder',
						role: 'newFolder',
						click: this.folders().new,
						
					}
				]),
				folder: Menu.buildFromTemplate([
					{
						label: 'New Note',
						role: 'new',
						click: this.files().new,
					}, {
						label: 'Rename',
						role: 'rename',
						click: this.folders().rename,
						
					}, {
						type: 'separator',
					}, {
						label: 'New Folder',
						role: 'newFolder',
						click: this.folders().new,
						
					}, {
						label: 'Delete Folder',
						role: 'delFolder',
						click: this.folders().delete,
						
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
						click: this.files().rename,
					}, {
						label: 'Delete',
						role: 'deleteFile',
						click: this.files().delete,
					}, {
						type: 'separator',
					}, {
						label: 'Open Containing Folder',
						role: 'openfolder',
						click:()=>{
							this.shell.showItemInFolder(this.pathToThis(this.currentRight.name));
						}
					}
				])
			}
		};
	}
});