const path = require('path');
const SimpleMDE = require('simplemde');
const fs = require('fs');
const { remote } = require('electron');
const { clipboard } = remote;
const { Menu, MenuItem, shell } = remote;

import {
	SimpleMDE,
	EditorModule,
} from '../../interfaces';
import Toolbar from './Toolbar';
import Events from '../Events/Events';
import IEditorPlugin from '../../PlugMan/IEditorPlugin';
import editMenuTemplate from '../../menu/edit_menu_template';

export default class Editor {
	private md: SimpleMDE;
	private savedUnsaved: HTMLSpanElement;
	private supressChange: boolean = false;
	private openedFileNode: HTMLSpanElement;
	private plugins: IEditorPlugin[];
	private base: HTMLDivElement;
	private startingPath: string;
	private imageHolder: HTMLDivElement;
	private editorHolder: HTMLDivElement;

	public set openedFile(filename: string) {
		if (this.openedFileNode != undefined) {
			this.openedFileNode.innerHTML = filename;
		} else {
			throw "openedFileNode is undefined";
		}
	}

	public set saved(isSaved: boolean) {
		if (this.savedUnsaved != undefined) {
			this.savedUnsaved.style.display = isSaved ? 'none' : 'initial';
		} else {
			throw "savedUnsaved is undefined";
		}
	}

	/**
	 * Default constructor
	 * @param startingPath The root of the notes folder
	 */
	constructor(startingPath: string) {
		this.startingPath = startingPath;

		this.base = <HTMLDivElement>
			document.querySelector('div.details-panel');

		this.openedFileNode = <HTMLSpanElement>
			document.querySelector('div.header-section > .text span:nth-child(1)');

		this.savedUnsaved = <HTMLSpanElement>
			document.querySelector('div.header-section > .text span:nth-child(2)');

		this.imageHolder = <HTMLDivElement> 
			this.base.querySelector('.image_holder');
		this.editorHolder = <HTMLDivElement>
			this.base.querySelector('.editor_holder');

		// Create SimpleMDE instance
		this.md = new SimpleMDE({
			element: this.base.querySelector("#editor"),
			spellChecker: false,
			shortcuts: {
				drawTable: "Cmd-Alt-T"
			},
			renderingConfig: {
				codeSyntaxHighlighting: true,
			},
			toolbar: Toolbar,
			tabSize: 4,
			autoDownloadFontAwesome: false,
		});

		this.codeMirrorEvents();

		// Load modules
		this.setRender();
	}

	/**
	 * Add an icon to the toolbar
	 * @param toAdd The icon to add (See SimpleMDE documentation)
	 */
	public addToToolbar(toAdd){
		let currentToolbar = document.querySelector('.editor-toolbar');
		if(currentToolbar){
			currentToolbar.outerHTML = '';
		}
		this.md.toolbar.push(toAdd);
		this.md.createToolbar();
	}

	/**
	 * Subcribe to preview rendering
	 * @param plugin Plugin that wishes to subscribe
	 */
	public addToPreviewRender(plugin:IEditorPlugin){
		this.plugins.push(plugin);
	}

	/**
	 * Change the contents of the editor
	 * @param filename Filename of the file opened
	 * @param contents Conents of the file opened
	 */
	public openFile(filename: string, contents: string) {
		this.openedFile = filename;
		
		if(this.md.isPreviewActive()){
			this.md.togglePreview();
		}

		if(path.extname(filename) == '.png' || path.extname(filename) == '.svg'){
			this.imageHolder.style.display = 'flex';
			this.editorHolder.style.display = 'none';

			let openedImageElement: HTMLImageElement = <HTMLImageElement> 
				this.imageHolder.querySelector('#previewImage');
			
			if(openedImageElement != null){
				openedImageElement.src = path.join(this.startingPath, filename);
			}
		}else{
			this.editorHolder.style.display = 'initial';	
			this.imageHolder.style.display = 'none';					
			this.supressChange = true;
			this.md.value(contents);
		}
		this.saved = true;
		this.md.codemirror.clearHistory();
	}

	/**
	 * Notify the editor that the current file is deleted
	 */
	public deletedFile() {
		this.openedFile = "";
		this.saved = false;
	}

	/**
	 * Set or get the value of the editor
	 * @param newContents New contents of the editor
	 * @returns {string} the editors current value
	 */
	public value(newContents: string): void;
	public value(): string;
	public value(newContents?: string) {
		if (newContents) {
			this.md.value(newContents);
			return;
		}
		return this.md.value() || "";
	}

	private codeMirrorEvents(): void {
		this.md.codemirror.on('change', (editor, change) => {
			if (!this.supressChange) {
				Events.trigger('editor.change');
				this.saved = false;
			} else {
				this.saved = true;
				this.supressChange = !this.supressChange;
			}
		});

		let extraKeys:any = this.md.codemirror.options.extraKeys;
		extraKeys['Ctrl-V'] = () => {
			let availableFormats: string[] = clipboard.availableFormats();
			let toBeAppended: string = "";

			if(availableFormats.indexOf('text/html') != -1 && 
					availableFormats.indexOf('image/png') != -1){
				let regex: RegExp = new RegExp('<img[^>]+src="([^">]+)"');
				let res;
				if((res = regex.exec(clipboard.readHTML())) != null){
					toBeAppended = `![Pasted image](${res[1]})`;
				}
			}else if(availableFormats.indexOf('text/plain') != -1){
				toBeAppended = clipboard.readText();
			}

			let cursor = this.md.codemirror.getCursor();
			this.md.codemirror.replaceRange(toBeAppended, cursor);				
		};
		this.md.codemirror.setOption('extraKeys',extraKeys);

		(<HTMLDivElement> this.md.codemirror.display.wrapper).oncontextmenu = () => {
			Menu.buildFromTemplate(editMenuTemplate).popup(remote.getCurrentWindow());
		};
	}

	/**
	 * Loads all editorial modules into an array
	 * @return array of EditorModule modules
	 */
	private setRender(): void {
		this.plugins = [];
		// Overwrite previewRender
		this.md.options.previewRender = (plaintext: string): string => {

			for (let i: number = 0; i < this.plugins.length; i++) {
				// All plugins have a preview function, to render
				// their their function to the preview view.
				plaintext = this.plugins[i].preview(plaintext);
			}

			// Parse the rest through markdown
			return this.md.markdown(plaintext);
		};
	}
}