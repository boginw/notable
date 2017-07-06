const path = require('path');
const SimpleMDE = require('simplemde');
const fs = require('fs');
const { remote } = require('electron');
const { clipboard } = remote;

import {
	SimpleMDE,
	EditorModule,
} from '../../../interfaces';
import Toolbar from './Toolbar';
import Events from '../Events/Events';


export default class Editor {
	private md: SimpleMDE;
	private savedUnsaved: HTMLSpanElement;
	private supressChange: boolean = false;
	private openedFileNode: HTMLSpanElement;
	private modules: EditorModule[];
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
		this.modules = this.loadModules(__dirname);
	}

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

	public deletedFile() {
		this.openedFile = "";
		this.saved = false;
	}

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

	}


	/**
	 * Loads all editorial modules into an array
	 * @param pathToThis path to the root app folder
	 * @param md 		 SimpleMDE instance to add preview
	 * 					 render.
	 * @return array of EditorModule modules
	 */
	private loadModules(pathToThis: string): EditorModule[] {
		// Get the path to the modules/editor folder	
		let editorModulesFolder: string = path.join(pathToThis, "modules/editor");
		// TODO: use IO instead of fs
		// Get all folders in modules/editor
		let folders: string[] = fs.readdirSync(editorModulesFolder)
			.filter((file: any) => fs.statSync(
				path.join(editorModulesFolder, file)).isDirectory());

		let modules: EditorModule[] = [];

		for (let i: number = 0; i < folders.length; i++) {
			// Get path to main js file
			let pathToModule: string = path.join(
				editorModulesFolder, folders[i], folders[i] + ".js");

			// Instantiate and store module 
			let mod: any = require(pathToModule)(document, this.md);
			modules.push(mod);
		}

		// Overwrite previewRender
		this.md.options.previewRender = (plaintext: string): string => {
			// Directory placeholder

			for (let i: number = 0; i < modules.length; i++) {
				// All modules have a preview function, to render
				// their their function to the preview view.
				plaintext = modules[i].preview(plaintext);
			}

			// Parse the rest through markdown
			return this.md.markdown(plaintext);
		};

		return modules;
	}
}