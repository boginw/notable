const request = require('superagent');
const { app, BrowserWindow } = require('electron').remote;

import Persist from '../Persist/Persist';


export default class GitHubAuth {
	private clientId: string;
	private clientSecret: string;
	private callback: (access_token: string, err: any) => any;
	private window:any;
	private accessToken:string;
	private scopes:string[];

	/**
	 * Default Constructor
	 * @param id Client ID
	 * @param secret Client Secret
	 * @param scopes Scopes to access
	 * @param callback Callback function
	 */
	constructor(id: string, secret: string, scopes: string[], 
			callback: (access_token: string, err: any) => any) {
		this.scopes = scopes;
		this.clientId = id;
		this.clientSecret = secret;
		this.window = null;
		this.callback = callback;

		// Check if we have a stored github access token
		let tempToken = Persist.load("github").accessToken;
		if(tempToken != undefined){
			this.accessToken = tempToken;
		}

		// Start getting token
		this.startRequest();
	}

	public startRequest(): void{
		// If we've already fetched the access token
		if(this.accessToken){
			this.callback(this.accessToken, null);
			return;
		}

		// Create a new window
		this.window = new BrowserWindow({
			width: 700,
			height: 500,
			webPreferences: { nodeIntegration: false },
		});

		this.window.setMenu(null);
		let authURL = 'https://github.com/login/oauth/authorize?client_id=' + this.clientId + '&scope=' + this.scopes;
		this.window.loadURL(authURL);
		this.window.show();
		this.window.webContents.on('will-navigate', (event, url) => {
			this.handleCallback(url);
		});
		this.window.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
			this.handleCallback(newUrl);
		});
		this.window.on('close', () => {
			this.window = null;
		}, false);
	}

	/**
	 * Handles URLs from GitHub to fecth codes
	 * @param url URL to handle
	 */
	private handleCallback(url): void{
		let raw_code = /code=([^&]*)/.exec(url) || null;
		let code = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
		let error = /\?error=(.+)$/.exec(url);
		if (code) {
			this.requestGithubToken(code);
		} else if (error) {
			alert('Oops! Something went wrong and we couldn\'t' +
				'log you in using Github. Please try again.');
		}
	}

	/**
	 * Fetches an access token from github by using
	 * a session code
	 * @param code Session code
	 */
	private requestGithubToken(code): void {
		request.post('https://github.com/login/oauth/access_token', {
			client_id: this.clientId,
			client_secret: this.clientSecret,
			code: code,
		}).end((err, response) => {
			this.window.destroy();
			if (err) {
				this.callback("", err);
			}
			this.accessToken = response.body.access_token;

			// Save the token to local storage
			Persist.save("github", { accessToken: this.accessToken });

			this.callback(response.body.access_token, null);
		});
	}
}