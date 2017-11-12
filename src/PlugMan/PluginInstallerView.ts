import PluginInstaller from './PluginInstaller';
import { Modal } from '../modules/Modal/Modal';
import MetaPlugin from './MetaPlugin';
import IPlugin from './IPlugin';

export default class PluginInstallerView {

	public static installPlugin(plugin: MetaPlugin, showInstalled:boolean = true): Promise<IPlugin> {
		let root: HTMLDivElement = document.createElement('div');
		let spinner: HTMLDivElement = document.createElement('div');
		spinner.classList.add("spinner");
		spinner.innerHTML = '<div class="dot1"></div><div class="dot2"></div>';
		root.appendChild(spinner);

		let modal: Modal = new Modal(root, "Installing Plugin", false);
		modal.clickOutsideClose = false;
		modal.show();

		return new Promise<IPlugin>((resolve, reject) => {
			let installer = new PluginInstaller((<any>window).notable.getContext());
			installer.installPlugin(plugin, true).then((val) => {
				modal.close();
				
				if(showInstalled){
					modal = new Modal(document.createElement('div'), "Plugin Installed", true);
					modal.show();	
				}

				resolve(val);
			}).catch((err) => {
				reject(err);
			});
		});
	}
}