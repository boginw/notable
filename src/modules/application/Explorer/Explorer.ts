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
}

export default class Explorer{
    private defaultPath:string;
    private base:HTMLDivElement;
    private io:IO;
    private fileNodes:FileNode[] = [];
    private explorerEvents:ExplorerEvents;

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
        };

        // Scan folder for available files
        this.scanFolder(defaultPath);

        // Render explorer
        this.renderExplorer(defaultPath, this.base);

        // Monitor files
        this.monitor(defaultPath);

        // Stop watching a folder if the program closes
        //remote.getCurrentWindow().on('close', close);
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
        if(this.explorerEvents[event] != undefined){
            // Trigger all subscribers 
            this.explorerEvents[event].forEach(element => {
                element(notableFile, contents);
            });
        }
    }

    /**
     * Stop watching folder
     */
    public close():void{
        if(this.io){
            this.io.unwatchDirectory(this.defaultPath);
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
				console.log(f,curr,prev,"new");
			} else if (curr.nlink === 0) {
				// f was removed
                let index = this.findFile(f.toString());
                if(index != -1){
                    this.fileNodes[index].fileRemoved();
                    this.trigger('deleted',
                        this.fileNodes[index].file,
                    );
                }
			} else {
				// f was changed
                let index = this.findFile(f.toString());
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
    private scanFolder(dir:string):void{
        // Get all files in the current working directory
        let files:NotableFile[] = this.io.filesInDirectory(dir);
        
        // Render and store files
        for (var i = 0; i < files.length; i++) {
            let filenode:FileNode = new FileNode(files[i]);
            filenode.on('click',(filenode:FileNode)=>{
                this.trigger(
                    'open', 
                    filenode.file, 
                    this.io.openFile(filenode.file.name)
                );

                this.fileNodes.forEach(element => {
                    element.setOpen(false);
                });

                filenode.setOpen(true);
            });
            this.fileNodes.push(filenode);
        }
    }

    /**
     * Sorts the files in an alphabetical order or 
     * most recently created order
     * @param {boolean} alpha Should sort alphabetically
     */
    private sortFiles(alpha:boolean):void{
        if(!alpha){
            // Time sort
            this.fileNodes = this.fileNodes.sort((a, b)=>{
                if(a.file.stat.isDirectory()){
                    return -1;
                }
                return b.file.stat.mtime.getTime() - a.file.stat.mtime.getTime();
            });
        }else{
            // Alphabetical sort
            this.fileNodes = this.fileNodes.sort((a, b) => {
                var aName:string = path.basename(a.file.name);
                var bName:string = path.basename(b.file.name);
                if(aName < bName){
                    return -1;
                }
                if(aName > bName){
                    return 1;
                }
                return 0;
            });
        }
    }

    /**
     * Renders the explorer side-bar
     * @param dir Directory to render
     * @param base Base html element
     */
    private renderExplorer(dir:string, base:HTMLDivElement):void{
        // Find the root node
        let root:HTMLUListElement = <HTMLUListElement> document.createElement('ul');
        // Sort by date?
        // TODO: move this elsewhere (preferably in a persiatant form)
        let sortalpha:boolean = true;

        // No files? show message that folder is empty
        if(this.fileNodes.length == 0){
            root.appendChild(this.renderEmpty());
            base.appendChild(root);
            return;
        }

        // Sort files
        this.sortFiles(sortalpha);

        // Render files
        for (var i = 0; i < this.fileNodes.length; i++) {
            root.appendChild(this.fileNodes[i].node);
        }

        base.appendChild(root);
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
