const { remote } = require('electron');
const { Menu, MenuItem } = remote;
const path = require('path');

import {
	NotableFile,
    ExplorerContexts,
    NoteBook
} from '../../../interfaces';
import TimeAgo from '../../../helpers/timeago';
import IO from '../IO/IO.js';

export default class Explorer{
    private defaultPath:string;
    private base:HTMLDivElement;
    private io:IO;
    private ta:TimeAgo;

    /**
     * Default constructor
     * @param {string} defaultPath The path inwhich the explorer
     *                             should start 
     */
    constructor(defaultPath:string){
        this.defaultPath = defaultPath;
        // Create IO instance
        this.io = new IO();
        // For "time ago" strings
        this.ta = new TimeAgo();
        // Find our base for files and folders
        this.base = <HTMLDivElement> document.querySelector('.folders_and_files');

        // Ensure that the default path exists
        if(!this.ensureFolderExists(defaultPath)){
            throw "Could not ensure that " + defaultPath + " exists...";
        }

        // Render explorer
        this.renderExplorer(defaultPath, this.base);
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
     * Renders the explorer side-bar
     * @param dir Directory to render
     * @param base Base html element
     */
    private renderExplorer(dir:string, base:HTMLDivElement):void{
        // Get all files in the current working directory
        let files:NotableFile[] = this.io.filesInDirectory(dir);
        // Find the root node
        let root:HTMLUListElement = <HTMLUListElement> document.createElement('ul');
        // Sort by date?
        // TODO: move this elsewhere (preferably in a persiatant form)
        let sortalpha:boolean = true;

        // No files? show message that folder is empty
        if(files.length == 0){
            root.appendChild(this.renderEmpty());
            base.appendChild(root);
            return;
        }

        // Sorting
        if(sortalpha){
            files = files.sort((a, b)=>{
                if(a.stat.isDirectory()){
                    return -1;
                }
                return b.stat.mtime.getTime() - a.stat.mtime.getTime();
            });
        }else{
            files = files.sort();
        }

        // Render files
        for (var i = 0; i < files.length; i++) {
            root.appendChild(this.renderItem(files[i]));
        }

        base.appendChild(root);
    }

    /**
     * Renders an item from the file system
     * @param {NotableFile} file Item to render
     * @return {HTMLLIElement} Rendered item
     */
    private renderItem(file:NotableFile):HTMLLIElement{
        let base:HTMLLIElement = document.createElement('li');
        // Files should be draggable
        base.draggable = !file.stat.isDirectory();

        let contents:HTMLSpanElement = document.createElement('span');
        contents.className = file.stat.isDirectory() ? "folderName" : "fileName";

        // Create file title and preview        
        let title:HTMLDivElement = document.createElement('div');
        title.className = "title";
        title.innerHTML = `<span class="titleText">${this.fileDisplayName(file)}</span>`;
        
        // Only files have preview and lastmod
        if(!file.stat.isDirectory()){
            // Time ago since file was created
            let timeAgo:string = this.ta.ago(new Date(file.stat.mtime));
            title.innerHTML += `
                <div class="fileDetails">
                    <div class="lastMod">${timeAgo}</div>
                    <div class="filePrev">${file.preview}</div>
                </div>`;
        }
        
        contents.appendChild(title);
        base.appendChild(contents);
        return base;
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

    /**
     * Strips extensions of files and leaves 
     * directories alone
     * 
     * @param  {file} 	 file 	file from getDirectoriesInPath
     * @return {string}	  	Filename without extension
     */
    private fileDisplayName(file:NotableFile):string{
        return file.stat.isDirectory() ? file.name : 
            file.name.substr(0,file.name.length-file.extension.length);
    }
}