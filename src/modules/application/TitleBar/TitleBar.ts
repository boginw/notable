const { remote } = require('electron'); // native electron module

import Events from '../../../modules/application/Events/Events';
import env from '../../../env';

import {
	SimpleMDE,
} from '../../../interfaces';

export default class TitleBar {
	public isWindows: boolean;
	public isLinux: boolean;
	private isFullscreen: boolean;
	private base: HTMLElement;

	/**
	 * Default constructor
	 */
	constructor(base: HTMLElement) {
		this.base = base;
		this.isWindows = process.platform == "win32";
		this.isLinux = process.platform == "linux";
		this.isFullscreen = remote.getCurrentWindow().isMaximized() ||
			remote.getCurrentWindow().isFullScreen();
		// Render the header
		this.renderHeader();
	}

	/**
	 * Create the header and attach the appropriate eventlisteners
	 * @return {HTMLDivElement} Header as HTML element
	 */
	private renderHeader(): void {
		let logo: HTMLDivElement = this.logo();
		let buttons: HTMLDivElement = this.titleBarButtons();

		// Create the sides
		let leftHeader: HTMLDivElement = document.createElement('div');
		leftHeader.className = "left-header";
		let rightHeader: HTMLDivElement = document.createElement('div');
		rightHeader.className = "right-header";

		// Flip the icon and title bar buttons depending on the OS
		if (this.isWindows) {
			leftHeader.appendChild(logo);
			rightHeader.appendChild(buttons);
		} else {
			leftHeader.appendChild(buttons);
			rightHeader.appendChild(logo);
		}

		// Login button
		let loginWrapper: HTMLDivElement = document.createElement('div');
		loginWrapper.className = "login-wrapper";

		let login: HTMLDivElement = document.createElement('div');
		login.className = "login no-drag";
		login.innerHTML = `<i class="icon material-icons">account_circle</i>
						   <span> LOGIN</span>`;
		login.onclick = function (): any {
			Events.trigger('titlebar.login');		
		};

		loginWrapper.appendChild(login);
		leftHeader.appendChild(loginWrapper);

		this.base.appendChild(leftHeader);
		this.base.appendChild(rightHeader);
	}

	/**
	 * Create logo and attach eventlistener
	 * @return {HTMLDivElement} Header as HTML element 
	 */
	private logo(): HTMLDivElement {
		let logo: HTMLDivElement = document.createElement('div');
		logo.className = 'logo';
		logo.innerHTML = '<img src="images/logo.png" width="25" height="26">';
		logo.onclick = this.handleLogo;

		return logo;
	}

	/**
	 * Create title bar buttons, and attach eventlistener
	 * @return {HTMLDivElement} Header as HTML element
	 */
	private titleBarButtons(): HTMLDivElement {
		let base: HTMLDivElement = document.createElement('div');
		base.className = (this.isWindows ? 'windows-buttons' : 'buttons');

		// Maximize button
		let maximize: HTMLDivElement = document.createElement('div');
		maximize.className = `button-fullscreen enabled 
			${(this.isWindows ? 'windows-button' : 'button')}`;
		maximize.innerHTML = '<div class="icon"></div>';
		maximize.onclick = () => {
			this.handleFullscreen();
		};

		// Minimize
		let minimize: HTMLDivElement = document.createElement('div');
		minimize.className = `button-minimize enabled 
			${(this.isWindows ? 'windows-button' : 'button')}`;
		minimize.innerHTML = '<div class="icon"></div>';
		minimize.onclick = () => {
			this.handleMinimize();
		};

		// Close button
		let close: HTMLDivElement = document.createElement('div');
		close.className = `button-close enabled 
			${(this.isWindows ? 'windows-button' : 'button')}`;
		close.onclick = () => {
			this.handleClose();
		};

		// The order is important to get right (Mac users get crazy)
		if (this.isWindows) {
			base.appendChild(minimize);
			base.appendChild(maximize);
		} else {
			base.appendChild(maximize);
			base.appendChild(minimize);
		}
		base.appendChild(close);

		return base;
	}

	/**
	 * When the user clicks the logo
	 */
	private handleLogo(): any {
		Events.trigger('titlebar.logo');
	}

	/**
	 * When the user clicks the close butten
	 */
	private handleClose(): any {
		if(env.name != 'test'){
			if (!this.isWindows && !this.isLinux) {
				remote.getCurrentWindow().hide();
			} else {
				remote.getCurrentWindow().close();
			}
		}

		Events.trigger('titlebar.close');		
	}

	/**
	 * When the user clicks the minimize button
	 */
	private handleMinimize(): any {
		remote.getCurrentWindow().minimize();

		Events.trigger('titlebar.minimize');		
	}

	/**
	 * When the user clicks the maximize button
	 */
	private handleFullscreen(): any {
		if (this.isWindows || this.isLinux) {
			if (remote.getCurrentWindow().isMaximized()) {
				remote.getCurrentWindow().unmaximize();
			} else {
				remote.getCurrentWindow().maximize();
			}

			this.isFullscreen = remote.getCurrentWindow().isMaximized();
		} else {
			remote.getCurrentWindow()
				.setFullScreen(!remote.getCurrentWindow().isFullScreen());
			this.isFullscreen = remote.getCurrentWindow().isFullScreen();
		}

		Events.trigger('titlebar.fullscreen');		
	}
}
