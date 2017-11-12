import { Modal, Confirm } from '../Modal/Modal';
import PluginInstallerView from '../../PlugMan/PluginInstallerView';
import MetaPlugin from '../../PlugMan/MetaPlugin';
import IPlugin from '../../PlugMan/IPlugin';
import ISyncPlugin from '../../PlugMan/ISyncPlugin';
import Events from '../Events/Events';

export default class SyncPrompt {
	private modal: Modal;
	private syncOptions:string[][];

	public constructor() {
		this.syncOptions = [
			["Notable", "./images/logo.png"],
			["Google Drive", "./images/google-drive-logo.svg"],
			["GitHub", "./images/github-logo.svg", "notable-sync-github"],
			["OneDrive", "./images/onedrive-logo.svg"],
			["Dropbox", "./images/dropbox-logo.svg"],
			["Other", "./images/npm-logo.svg"],
		];

		let root: HTMLDivElement = document.createElement('div');
		let options: HTMLDivElement = document.createElement('div');
		options.classList.add("syncOptions");

		this.syncOptions.forEach((val) => {
			options.appendChild(this.renderOption(val, this.handleClick.bind(this)));
		});

		root.appendChild(options);

		this.modal = new Modal(root, "Sync Services", true);
	}

	public show(){
		this.modal.show();
		return this;
	}

	private handleClick(options:string[]){
		this.modal.close();
	
		if(options.length != 3){
			alert("Sorry, this is not implemented yet :(");
			return;
		}

		PluginInstallerView.installPlugin(<MetaPlugin>{
			name: options[2]
		}, false).then((val:IPlugin)=>{
			console.log((val) as ISyncPlugin);
			(val as ISyncPlugin).login();
			Events.trigger("IOHandler.AddIO", (val as ISyncPlugin));
		});
	}

	private renderOption(options:string[], callback:(options:string[])=>any) {
		let root: HTMLAnchorElement = document.createElement('a');
		let image: HTMLImageElement = document.createElement('img');
		let text: HTMLDivElement = document.createElement('div');

		root.classList.add("syncButton");
		root.title = options[0];

		image.align = "absmiddle";
		image.border = "0";
		image.src = options[1];

		text.innerText = options[0];

		root.appendChild(image);
		root.appendChild(text);

		root.onclick = () => { callback(options); };
		return root;
	}
}