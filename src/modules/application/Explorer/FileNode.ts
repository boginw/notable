const { remote } = require('electron');
const { Menu, MenuItem, shell } = remote;
const path = require('path');
const openClass:string = 'open';

import {
	NotableFile,
} from '../../../interfaces';
import TimeAgo from '../../../helpers/timeago';
import Events from '../../../helpers/Events';

export default class FileNode{
    public node: HTMLLIElement;
    private _file:NotableFile;
    private ta:TimeAgo;
    private _open:boolean;
    private base:HTMLLIElement;
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
     * Set file related events
     */
    private setEvents():void{
        // Click events
        this.base.onclick = () => {
            Events.trigger('file.click', this);
        };
        this.base.ondblclick = () => {
            this.renameFile();
            Events.trigger('file.dbclick', this);
        };
        this.base.oncontextmenu = () => {
            Events.trigger('file.contextmenu', this);
            this.rightclick();
        };
        
        // Drag events
        this.base.ondragstart = () => {
            Events.trigger('file.dragstart', this);
        };
        this.base.ondragover = () => {
            Events.trigger('file.dragover', this);
        };
        this.base.ondragenter = () => {
            Events.trigger('file.dragenter', this);
        };
        this.base.ondrop = () => {
            Events.trigger('file.drop', this);
        };

        // Rename events
        // TODO: this doesn't work with this.renameInput, but this is good enough
        let inputField:HTMLInputElement = <HTMLInputElement> 
            this.base.querySelector('.inputTitleText');

        inputField.addEventListener('keypress',(ev:KeyboardEvent)=>{
            if(ev.keyCode == 13){
                Events.trigger('file.rename', this, inputField.value + this.file.extension);
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
                    label: 'Rename',
                    role: 'rename',
                    click: this.renameFile(),
                }, {
                    label: 'Delete Folder',
                    role: 'delFolder',
                    click: ()=>{
                        Events.trigger('file.delete', this);
                    },    
                }, {
                    type: 'separator',
                }, {
                    label: 'New Folder',
                    role: 'newFolder',
                    click: () => {
                        Events.trigger('file.newFolder')
                    },
                }, {
                    label: 'New Note',
                    role: 'new',
                    click: () => {
                        Events.trigger('file.newFile')
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
                        Events.trigger('file.delete', this);
                    },
                }, {
                    type: 'separator',
                }, {
                    label: 'New Folder',
                    role: 'newFolder',
                    click: () => {
                        Events.trigger('file.newFolder')
                    },
                }, {
                    label: 'New Note',
                    role: 'new',
                    click: () => {
                        Events.trigger('file.newFile')
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
        
        let timeAgo:string = this.ta.ago(new Date(file.stat.mtime));
        // Only files have preview and lastmod
        if(!file.stat.isDirectory()){
            // Time ago since file was created
            title.innerHTML += `
                <div class="fileDetails">
                    <div class="lastMod">${timeAgo}</div>
                    <div class="filePrev">${file.preview}</div>
                </div>`;
        }else{
            /*title.innerHTML += `
                <div class="fileDetails">
                    <div class="lastMod">${timeAgo}</div>
                    <div class="filePrev">12 notes in notebook</div>
                </div>`;*/
        }
        
        contents.appendChild(title);
        this.base.appendChild(contents);
        return this.base;
    }

    public agoInterval():any{
        
    }
}