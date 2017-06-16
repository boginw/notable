const { remote } = require('electron');
const { Menu, MenuItem, shell } = remote;
const path = require('path');
const openClass:string = 'open';

import {
	NotableFile,
} from '../../../interfaces';
import TimeAgo from '../../../helpers/timeago';

interface FileNodeEvents{
    click:((filenode:FileNode, contents?:string) => any)[];
    dblclick:((filenode:FileNode, contents?:string) => any)[];
    contextmenu:((filenode:FileNode, contents?:string) => any)[];
    dragstart:((filenode:FileNode, contents?:string) => any)[];
    dragover:((filenode:FileNode, contents?:string) => any)[];
    dragenter:((filenode:FileNode, contents?:string) => any)[];
    drop:((filenode:FileNode, contents?:string) => any)[];
    newFile:((filenode:FileNode, contents?:string) => any)[];
    newFolder:((filenode:FileNode, contents?:string) => any)[];
    delete:((filenode:FileNode, contents?:string) => any)[];
    rename:((filenode:FileNode, contents?:string) => any)[];
}

export default class FileNode{
    public node: HTMLLIElement;
    private _file:NotableFile;
    private ta:TimeAgo;
    private _open:boolean;
    private base:HTMLLIElement;
    private fileEvents:FileNodeEvents;
    private renameInput:HTMLInputElement;

    get file():NotableFile {
        return this._file;
    }

    // Everytime file us updated, the file should rerender
    set file(notafile:NotableFile) {
        this._file = notafile;
        this.node = this.renderItem(this.file);
        // Store events
        this.setEvents();
    }

    get open():boolean {
        return this._open;
    }

    set open(o:boolean) {
        this._open = o;
        this.setOpen(o);
    }

    /**
     * Default constructor
     * @param file Notable file
     */
    constructor(file:NotableFile){
        // For "time ago" strings
        this.ta = new TimeAgo();

        this.fileEvents = {
            click:new Array<(filenode:FileNode, contents?:string) => any>(0),
            dblclick:new Array<(filenode:FileNode, contents?:string) => any>(0),
            contextmenu:new Array<(filenode:FileNode, contents?:string) => any>(0),
            dragstart:new Array<(filenode:FileNode, contents?:string) => any>(0),
            dragover:new Array<(filenode:FileNode, contents?:string) => any>(0),
            dragenter:new Array<(filenode:FileNode, contents?:string) => any>(0),
            drop:new Array<(filenode:FileNode, contents?:string) => any>(0),
            newFile:new Array<(filenode:FileNode, contents?:string) => any>(0),
            newFolder:new Array<(filenode:FileNode, contents?:string) => any>(0),
            delete:new Array<(filenode:FileNode, contents?:string) => any>(0),
            rename:new Array<(filenode:FileNode, contents?:string) => any>(0),
        };

        // Base should only be created once
        this.base = document.createElement('li');

        // Store file, and render
        this.file = file;
    }

    public renameFile():void{
        let inputField:HTMLInputElement = <HTMLInputElement> 
            this.base.querySelector('.inputTitleText');
        inputField.style.display = 'inline-block';
        inputField.value = this.fileDisplayName(this.file);
        inputField.focus();
        inputField.setSelectionRange(0, inputField.value.length);
    }

    public renameFileBlur():void{
        let inputField:HTMLInputElement = <HTMLInputElement> 
            this.base.querySelector('.inputTitleText');
        inputField.style.display = 'none';
        inputField.value = '';
    }

    /**
     * Subscribe to specific event
     * @param {string} event Event to subscribe to
     * @param {anonymous function} trigger Trigger callback
     */
    public on(event:string,trigger:(filenode:FileNode, contents?:string) => void):void{
        if(this.fileEvents[event] == undefined){
            return;
        }

        this.fileEvents[event].push(trigger);
    }

    /**
     * Trigger specific event
     * @param {string} event Event to trigger
     */
    public trigger(event:string, contents?:string):void{
        if(this.fileEvents[event] != undefined){
             this.fileEvents[event].forEach(element => {
                element(this,contents);
            });
        }
    }

    /**
     * Set file related events
     */
    private setEvents():void{
        // Click events
        this.base.onclick = () => {
            this.trigger('click');
        };
        this.base.ondblclick = () => {
            this.renameFile();
            this.trigger('dbclick');
        };
        this.base.oncontextmenu = () => {
            this.trigger('contextmenu');
            this.rightclick();
        };
        
        // Drag events
        this.base.ondragstart = () => {
            this.trigger('dragstart');
        };
        this.base.ondragover = () => {
            this.trigger('dragover');
        };
        this.base.ondragenter = () => {
            this.trigger('dragenter');
        };
        this.base.ondrop = () => {
            this.trigger('drop');
        };

        // Rename events
        // TODO: this doesn't work with this.renameInput, but this is good enough
        let inputField:HTMLInputElement = <HTMLInputElement> 
            this.base.querySelector('.inputTitleText');

        inputField.addEventListener('keypress',(ev:KeyboardEvent)=>{
            if(ev.keyCode == 13){
                this.trigger('rename', inputField.value + this.file.extension);
                this.renameFileBlur();
            }
        },true);

        inputField.onblur = () => {
            this.renameFileBlur();
        }
    }

    /**
     * Handle rightclick context menus
     */
    private rightclick():any{
        if(this.file.stat.isDirectory()){
            Menu.buildFromTemplate([
                {
                    label: 'New Note',
                    role: 'new',
                    click: () => {
                        this.trigger('newFile')
                    },
                }, {
                    label: 'Rename',
                    role: 'rename',
                    click: this.renameFile(),
                }, {
                    type: 'separator',
                }, {
                    label: 'New Folder',
                    role: 'newFolder',
                    click: () => {
                        this.trigger('newFolder')
                    },
                    
                }, {
                    label: 'Delete Folder',
                    role: 'delFolder',
                    click: ()=>{
                        this.trigger('delete')
                    },
                    
                }, {
                    type: 'separator',
                }, {
                    label: 'Folder Properties',
                    role: 'propFolder',
                }
            ]).popup(remote.getCurrentWindow());
        }else{
            Menu.buildFromTemplate([
                {
                    label: 'Rename',
                    role: 'rename',
                    click: this.renameFile(),
                }, {
                    label: 'Delete',
                    role: 'deleteFile',
                    click: ()=>{
                        this.trigger('delete')
                    },
                }, {
                    type: 'separator',
                }, {
                    label: 'Open Containing Folder',
                    role: 'openfolder',
                    click:()=>{
                        shell.showItemInFolder(this.file.name);
                    }
                }
            ]).popup(remote.getCurrentWindow());            
        }
    }

    /**
     * Destroy node
     */
    public fileRemoved():void{
        this.node.remove();
    }
    
    /**
     * Sets if the file is open
     * @param {boolean} isOpen Whether the file is open or not
     */
    public setOpen(isOpen:boolean):void{
        if(this.base != undefined){
            if(isOpen){
                this.base.classList.add(openClass);
            }else{
                this.base.classList.remove(openClass);
            }
        }
    }

    /**
     * Strips extensions  of files and returns the base
     * filename
     * @param  {file} 	 file 	file from getDirectoriesInPath
     * @return {string}	  	Filename without extension
     */
    private fileDisplayName(file:NotableFile):string{
        let fname:string = file.stat.isDirectory() ? file.name : 
            file.name.substr(0,file.name.length-file.extension.length);

        return path.basename(fname);
    }

    /**
     * Renders an item from the file system
     * @param {NotableFile} file Item to render
     * @return {HTMLLIElement} Rendered item
     */
    private renderItem(file:NotableFile):HTMLLIElement{
        // Files should be draggable
        this.base.draggable = !file.stat.isDirectory();

        // Clean base html so we don't add dublicates
        this.base.innerHTML = '';

        // Create contents container
        let contents:HTMLSpanElement = document.createElement('span');
        contents.className = file.stat.isDirectory() ? "folderName" : "fileName";

        // Create file title and preview        
        let title:HTMLDivElement = document.createElement('div');
        title.className = "title";
        title.innerHTML = `<span class="titleText">${this.fileDisplayName(file)}</span>`;

        this.renameInput = document.createElement('input');
        this.renameInput.className = "inputTitleText";

        title.appendChild(this.renameInput);
        
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
        this.base.appendChild(contents);
        return this.base;
    }

    public agoInterval():any{
        
    }
}