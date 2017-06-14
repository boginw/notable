import * as os from 'os'; // native node.js module
const fs = require('fs');
const path = require('path');
const { remote } = require('electron'); // native electron module
const { app } = remote;
const jetpack = require('fs-jetpack'); // module loaded from npm
const SimpleMDE = require('simplemde');
import env from './env';

// Electron does not have HiDPI for Linux yet, so here's a workaround
import ZoomFactor from './modules/application/ZoomFactor/ZoomFactor';
import TitleBar from './modules/application/TitleBar/TitleBar';
import Explorer from './modules/application/Explorer/Explorer';

import {
	EditorModule,
	SimpleMDE,
	NotableFile
} from './interfaces';

namespace Notable {

	class Notable{
		md:SimpleMDE;
		modules:EditorModule[];
		openedFile:NotableFile|null;

		/**
		 * Default constructor
		 */
		constructor(){
			// Zoom to defined scale (Linux specific)
			new ZoomFactor().zoom();

			let openedFileNode:HTMLSpanElement = <HTMLSpanElement> 
				document.querySelector('div.header-section > .text span:nth-child(1)');

			// Create SimpleMDE instance
			this.md = new SimpleMDE({
				element: document.getElementById("editor"),
				spellChecker: false,
				shortcuts: {
					drawTable: "Cmd-Alt-T"
				},
				renderingConfig: {
					codeSyntaxHighlighting: true,
				}
			});
			
			new TitleBar(document, this.md);
			let explorer:Explorer = new Explorer(path.join(app.getPath('documents'),'notes'));
			explorer.on('open',(file:NotableFile, contents) => {
				openedFileNode.innerHTML = 
					file.name.replace(path.join(app.getPath('documents'),'notes'),'');
				this.md.value(contents);
				this.openedFile = file;
			});

			explorer.on('deleted',(file:NotableFile, contents) => {
				if(this.openedFile != null && file.name == this.openedFile.name){
					openedFileNode.innerHTML = "";
					this.openedFile = null;
					alert("This file was deleted");
				}
			});

			// Load modules
			this.modules = this.loadModules(__dirname, this.md);
		}

		/**
		 * Loads all editorial modules into an array
		 * @param pathToThis path to the root app folder
		 * @param md 		 SimpleMDE instance to add preview
		 * 					 render.
		 * @return array of EditorModule modules
		 */
		private loadModules(pathToThis:string, md:SimpleMDE): EditorModule[]{
			// Get the path to the modules/editor folder	
			let editorModulesFolder:string = path.join(pathToThis, "modules/editor");
			// Get all folders in modules/editor
			let folders:string[] = fs.readdirSync(editorModulesFolder)
				.filter((file:any) => fs.statSync(path.join(editorModulesFolder, file)).isDirectory());
			
			let modules:EditorModule[] = [];
			
			for(var i:number = 0; i < folders.length; i++){
				// Get path to main js file
				let pathToModule:string = path.join(
					editorModulesFolder, folders[i], folders[i] + ".js");

				// Instantiate and store module 
				let mod:any = require(pathToModule)(document, md);
				modules.push(mod);
			}

			// Overwrite previewRender
			md.options.previewRender = (plaintext: string): string => {
				// Directory placeholder
				
				for(var i:number = 0; i < modules.length; i++){
					// All modules have a preview function, to render
					// their their function to the preview view.
					plaintext = modules[i].preview(plaintext);
				}
				
				// Parse the rest through markdown
				return md.markdown(plaintext);
			};

			return modules;
		}
	}

	document.addEventListener('DOMContentLoaded', () => {
		// Start application
		new Notable();
	});
}