const { remote } = require('electron');
const { Menu } = remote;
const path = require('path');

import {
	NotableFile
} from '../../interfaces';

import FileNode from './FileNode';
import HoverEngine from './HoverEngine';
import Events from '../Events/Events';
import folderContext from './ContextMenu';

export default class Render {

	/**
	 * Removes the current root from base, renders a new root, and adds it to the base
	 * @param files Files to be rendered
	 * @param root The current root
	 * @param base The base
	 */
	public static rerender(files: FileNode[], root: HTMLUListElement,
		base: HTMLDivElement): HTMLUListElement {
		root.remove();
		root = this.renderExplorer(files);
		base.appendChild(root);

		return root;
	}


	/**
	 * Renders the explorer side-bar
	 * @param {FileNode[]} files The files in the explorer
	 * @return {HTMLUListElement} The rendered explorer
	 */
	public static renderExplorer(files: FileNode[]): HTMLUListElement {
		let newRoot: HTMLUListElement = document.createElement('ul');
		
		// Why? to force chrome to accept that this list can have focus
		newRoot.tabIndex = 1;
		newRoot.id = "explorerCanHasFocus";

		let hoverEngine = new HoverEngine(newRoot); 

		newRoot.onfocus = (ev: FocusEvent) : any => {
			hoverEngine.attach();
		};

		newRoot.onblur = (ev: FocusEvent) : any => {
			hoverEngine.detatch();
		};

		// No files? show message that folder is empty
		if (files.length == 0) {
			newRoot.appendChild(this.renderEmpty());
			return newRoot;
		}

		// Render files
		for (let i = 0; i < files.length; i++) {
			newRoot.appendChild(files[i].node);
		}

		newRoot.addEventListener('contextmenu', (ev: PointerEvent) => {
			if (ev.srcElement == newRoot) {
				Menu.buildFromTemplate(folderContext).popup(remote.getCurrentWindow());
			}
		}, true);

		return newRoot;
	}

	/**
	 * Show that this folder is empty by displaying a message
	 * @return {HTMLDivElement} Element containing message
	 */
	public static renderEmpty(): HTMLDivElement {
		let empty: HTMLDivElement = document.createElement('div');
		empty.className = "empty-folder";
		empty.innerHTML = `<div>
            <i class="icon material-icons">sentiment_neutral</i>
            <h3>This folder seems empty...</h3>
            <h4>Would you like to create a notebook?<br />Just right-click here!</h4>
        </div>`;
		this.emptyContextMenu(empty, false);
		return empty;
	}

	public static emptyContextMenu(base: HTMLElement, strict: boolean = true) {
		base.addEventListener('contextmenu', (ev: PointerEvent) => {
			if (ev.srcElement == base || !strict) {
				Menu.buildFromTemplate(folderContext).popup(remote.getCurrentWindow());
			}
		}, true);
	}
}