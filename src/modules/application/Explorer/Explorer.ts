const { remote } = require('electron');
const path = require('path');

import {
	NotableFile,
    ExplorerContexts,
    NoteBook
} from '../../../interfaces';
import TimeAgo from '../../../helpers/timeago';
import IO from '../IO/IO';
import FileNode from './FileNode';

interface ExplorerEvents{
    open:((notableFile:NotableFile, contents:string) => any)[];
    change:((notableFile:NotableFile, contents:string) => any)[];
    new:((notableFile:NotableFile, contents:string) => any)[];
    deleted:((notableFile:NotableFile, contents:string) => any)[];
    rename:((notableFile:NotableFile, contents:string) => any)[];
}

export default class Explorer{
    private defaultPath:string;
    private currentPath:string;
    private base:HTMLDivElement;
    private root:HTMLUListElement;
    private io:IO;
    private fileNodes:FileNode[] = [];
    private explorerEvents:ExplorerEvents;
    // Sort by date?
    // TODO: move this elsewhere (preferably in a persiatant form)
    private sortalpha:boolean = true;

    /**
     * Default constructor
     * @param {string} defaultPath The path inwhich the explorer
     *                             should start 
     */
    constructor(defaultPath:string){
        this.defaultPath = defaultPath;
        // Create IO instance
        this.io = new IO();
        // Find our base for files and folders
        this.base = <HTMLDivElement> document.querySelector('.folders_and_files');

        // Ensure that the default path exists
        if(!this.ensureFolderExists(defaultPath)){
            throw "Could not ensure that " + defaultPath + " exists...";
        }

        this.explorerEvents = {
            open:new Array<(notableFile:NotableFile, contents:string) => any>(0),
            change:new Array<(notableFile:NotableFile, contents:string) => any>(0),
            new:new Array<(notableFile:NotableFile, contents:string) => any>(0),
            deleted:new Array<(notableFile:NotableFile, contents:string) => any>(0),
            rename:new Array<(notableFile:NotableFile, contents:string) => any>(0),
        };

        // Scan folder for available files
        this.fileNodes = this.scanFolder(defaultPath);

        // Sort files
        this.sortFiles();


        // Create the root node
        // Render explorer
        this.root = this.renderExplorer(this.fileNodes);
        this.base.appendChild(this.root);

        // Monitor files
        this.monitor(defaultPath);

        let homeDirNavigation:HTMLDivElement = 
            <HTMLDivElement> document.querySelector('.pathItem.home');
        
        homeDirNavigation.onclick = () => {
            this.closeDirectory(this.defaultPath);
        }
        this.currentPath = defaultPath;        
    }

    /**
     * Subscribe function to a specific event
     * @param {string} event Event to listen to
     * @param {anonymous function} trigger The trigger callback
     */
    public on(event:string,trigger:(notableFile:NotableFile, contents:string) => void):void{
        // Check if the event exists
        if(this.explorerEvents[event] == undefined){
            return;
        }
        // Subscribe
        this.explorerEvents[event].push(trigger);
    }

    /**
     * Triggers a file related event 
     * @param {string} event Event to trigger
     * @param {NotableFile} notableFile File involved in the triggering
     * @param {string} contents Contents of the file triggered
     */
    public trigger(event:string, notableFile:NotableFile, contents?:string):void{
        // Ensure that the event exists
        if(this.explorerEvents[event] !== undefined){
            // Trigger all subscribers 
            this.explorerEvents[event].forEach(element => {
                element(notableFile, contents);
            });
        }
    }

    /**
     * Checks if a folder exists, and if not, create it
     * by all means
     * @param {string} dir Folder to ensure exists
     * @return {boolean} Whether or not it was possible to
     *                   ensure existance.
     */
    private ensureFolderExists(dir):boolean{
        // If the folder exists or folder is undefined
        // then we say that we have ensured that the
        // folder exists
        if(this.io.exists(dir) || !dir){
            return true;
        }

        // Split the path by the OS seperator
        let splitDir:string[] = dir.split(path.sep);
        // Pop to get the last element of splitDir and remove it
        let folderToCreate:string = splitDir.pop() || "";
        // Create the path to the folder above this one
        let newDir:string = splitDir.join(path.sep);

        // Ensure that the folder above this exists
        if(this.ensureFolderExists(newDir)){
            // Create the folder
            this.io.createFolder(path.join(newDir, folderToCreate));
            return true;
        }
        // Folder could not be created
        return false;
    }

    /**
     * Monitors a directory for file changes, new files and file
     * deletions.
     * @param {string} dir Directory to monitor
     */
    private monitor(dir:string):void{
        this.io.watchDirectory(dir, (f:string|object, curr, prev)=>{
			if (typeof f == "object" && prev === null && curr === null) {
				// Finished walking the tree
				console.log("Directory monitor ready");
			} else if (prev === null) {
				// f is a new file
                let index:number = this.findFile(f.toString());
				if(index == -1){
                    let file:NotableFile = this.io.fileFromPath(f.toString(),curr);
                    let fileNode:FileNode = this.createFileNode(file);
                    let inserted:boolean = false;

                    for (var i = 0; i < this.fileNodes.length; i++) {
                        if(this.sorter(fileNode, this.fileNodes[i]) == -1){
                            this.root.insertBefore(fileNode.node, this.fileNodes[i].node);
                            inserted = true;
                            this.fileNodes.splice(i, 0, fileNode);
                            break;
                        }
                    }

                    if(!inserted){
                        this.fileNodes.push(fileNode);
                        this.root.appendChild(fileNode.node);
                    }
                }else{
                    this.fileNodes[index].file = 
                        this.io.fileFromPath(f.toString(), curr);
                }
			} else if (curr.nlink === 0) {
				// f was removed
                let index:number = this.findFile(f.toString());
                if(index != -1){
                    this.fileNodes[index].fileRemoved();
                    this.trigger('deleted',
                        this.fileNodes[index].file,
                    );
                    this.fileNodes.splice(index,1);
                }
			} else {
				// f was changed
                let index:number = this.findFile(f.toString());
                if(index != -1){
                    this.fileNodes[index].file = 
                        this.io.fileFromPath(f.toString(), curr);
                    this.trigger('changed',
                        this.fileNodes[index].file,
                        this.io.openFile(this.fileNodes[index].file.name)
                    );
                }
			}
        });
    }

    /**
     * Searches for the index of a file in the fileNodes
     * array.
     * @param {string} filePath Path to the file to search for
     * @return {number} Index of file in array, or -1 if not found
     */
    private findFile(filePath:string):number{
        for (var i = 0; i < this.fileNodes.length; i++) {
            if(this.fileNodes[i].file.name == filePath){
                return i;
            }
        }
        return -1;
    }

    /**
     * Scan folder for files
     * @param {string} dir Directory to scan
     */
    private scanFolder(dir:string):FileNode[]{
        // Get all files in the current working directory
        let files:NotableFile[] = this.io.filesInDirectory(dir);
        let fileNodes:FileNode[] = [];
        // Render and store files
        for (var i = 0; i < files.length; i++) {
            fileNodes.push(this.createFileNode(files[i]));
        }
        return fileNodes;
    }

    private openDirectory(dirPath:string):void{
        // Scan the new folder
        this.fileNodes = this.scanFolder(dirPath);
        // Create a new root
        let newRoot:HTMLUListElement = this.renderExplorer(this.fileNodes);
        newRoot.classList.add("animateIn");
        this.base.appendChild(newRoot);
        
        this.updateNavigator(dirPath);

        // TODO: find it again?
        newRoot = <HTMLUListElement> document.querySelector('.animateIn');
        // Old root animate out
        this.root.classList.add('animateOut');
        
        // Timeout needed for some wierd reason
        setTimeout(()=>{
            // Animate new root in
            newRoot.classList.remove('animateIn');
        },5);
        
        // Switch roots
        let oldRoot:HTMLUListElement = this.root;
        this.root = newRoot;

        oldRoot.addEventListener("transitionend", function(event) {
            oldRoot.outerHTML = '';
        }, false);

        this.currentPath = dirPath;        
    }

    private closeDirectory(dirPath:string):void{
        if(dirPath == this.currentPath){
            return;
        }

        this.updateNavigator(dirPath);
        this.fileNodes = this.scanFolder(dirPath);
        let newRoot:HTMLUListElement = this.renderExplorer(this.fileNodes);
        newRoot.classList.add("animateOut");
        this.base.appendChild(newRoot);
        // TODO: find it again?
        newRoot = <HTMLUListElement> document.querySelector('.animateOut');
        // Old root animate out
        this.root.classList.add('animateIn');

        // Timeout needed for some wierd reason
        setTimeout(()=>{
            // Animate new root in
            newRoot.classList.remove('animateOut');
        },5);

        // Switch roots
        let oldRoot:HTMLUListElement = this.root;
        this.root = newRoot;

        oldRoot.addEventListener("transitionend", function(event) {
            oldRoot.outerHTML = '';
        }, false);

        this.currentPath = dirPath;        
    }

    private updateNavigator(dirPath:string){
        let navigation:HTMLDivElement = 
            <HTMLDivElement> document.querySelector('.settings.navigation');
        let relativePath:string = dirPath.replace(this.defaultPath,'');
        if(relativePath[0] == path.sep){
            relativePath = relativePath.substr(1);
        }
        let directorySplitted:string[];
        if(relativePath.length == 0){
            directorySplitted = [];
        }else{
            directorySplitted = relativePath.split(path.sep);
        }

        while(directorySplitted.length + 1 != navigation.children.length){
            if(directorySplitted.length + 1 > navigation.children.length){
                let newPath:HTMLDivElement = document.createElement('div');
                newPath.className = 'pathItem';
                newPath.innerText = directorySplitted[navigation.children.length - 1];
                newPath.onclick = () => {
                    let updatedPath:string = this.defaultPath+path.sep+
                        directorySplitted.slice(0,navigation.children.length - 1).join(path.sep);
                    this.closeDirectory(updatedPath);
                }
                navigation.appendChild(newPath);
            }else{
                if(navigation != null && navigation.lastElementChild != null){
                    navigation.lastElementChild.remove();
                }
            }
        }
    }

    private createFileNode(file:NotableFile):FileNode{
        let filenode:FileNode = new FileNode(file);
        filenode.on('click',(filenode:FileNode)=>{
            this.fileNodes.forEach(element => {
                element.setOpen(false);
            });
            filenode.setOpen(true);

            if(!filenode.file.stat.isDirectory()){
                this.trigger(
                    'open', 
                    filenode.file, 
                    this.io.openFile(filenode.file.name)
                );
            }else{
                this.openDirectory(filenode.file.name);
            }
        });

        filenode.on('delete',(filenode:FileNode)=>{
            if(confirm("Are you sure you want to delete this file? This cannot be undone.")){
                filenode.fileRemoved();
                this.io.deleteFile(filenode.file.name);
            }
        });

        filenode.on('rename',(filenode:FileNode, contents:string)=>{
            let pathArray:string[] = filenode.file.name.split(path.sep);
            pathArray.pop();
            pathArray.push(contents);
            
            let newFile:NotableFile = <NotableFile>{
                name:pathArray.join(path.sep),
                extension:filenode.file.extension,
                stat:filenode.file.stat,
                open:filenode.file.open,
                childrens:filenode.file.childrens,
                preview:filenode.file.preview,
            };

            this.io.rename(filenode.file.name, newFile.name);
            this.trigger('rename',
                filenode.file, newFile.name
            );
            filenode.file = newFile;

        });

        return filenode;
    }

    /**
     * Sorts the files in an alphabetical order or 
     * most recently created order
     */
    private sortFiles():void{
        this.fileNodes = this.fileNodes.sort((a:FileNode, b:FileNode) => {
            return this.sorter(a, b);
        });
    }

    /**
     * Sorting comparing function for sorting files
     * @param {boolean} alpha Should sort alphabetically
     * @return {number} Should come before, after, doesn't matter
     */
    private sorter(a:FileNode, b:FileNode):number{
        if(!this.sortalpha){
            // Time sort
            if(a.file.stat.isDirectory()){
                return -1;
            }
            return b.file.stat.mtime.getTime() - a.file.stat.mtime.getTime();
        }
    
        // Alphabetical sort
        var aName:string = path.basename(a.file.name);
        var bName:string = path.basename(b.file.name);
        if(aName < bName){
            return -1;
        }
        if(aName > bName){
            return 1;
        }
        return 0;
    }

    /**
     * Renders the explorer side-bar
     * @param dir Directory to render
     * @param base Base html element
     */
    private renderExplorer(files:FileNode[]):HTMLUListElement{
        let newRoot:HTMLUListElement = document.createElement('ul');

        // No files? show message that folder is empty
        if(files.length == 0){
            newRoot.appendChild(this.renderEmpty());
            return newRoot;
        }

        // Render files
        for (var i = 0; i < files.length; i++) {
            newRoot.appendChild(files[i].node);
        }

        return newRoot;
    }

    /**
     * Show that this folder is empty by displaying a message
     * @return {HTMLDivElement} Element containing message
     */
    private renderEmpty():HTMLDivElement{
        let empty:HTMLDivElement = document.createElement('div');
        empty.className = "empty-folder";
        empty.innerHTML = `<div>
            <i class="icon material-icons">sentiment_neutral</i>
            <h3>This folder seems empty...</h3>
            <h4>Would you like to create a notebook?<br />Just right-click here!</h4>
        </div>`;
        return empty;
    }
}
