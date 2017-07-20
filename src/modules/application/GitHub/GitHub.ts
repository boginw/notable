// TypeScript version of 
// https://github.com/uraway/electron-oauth-github
// Extended functionality

const assert = require('assert');
const { app, BrowserWindow } = require('electron').remote;
const request = require('superagent');
import Persist from '../Persist/Persist';

export default class GitHub {
	private scopes:string[];
	private clientId:string;
	private clientSecret:string;
	private window:any;
	private callback:(access_token:string,err:any)=>any;
	private accessToken:string;

	constructor(id:string, secret:string, scopes:string[], accessToken?:string) {
		assert(id, 'Client ID is needed!');
		assert(secret, 'Client Secret is needed!');
		this.scopes = scopes;
		this.clientId = id;
		this.clientSecret = secret;
		this.window = null;
		if(accessToken){
			this.accessToken = accessToken;
		}else{
			let tempToken = Persist.load("github").accessToken;
			if(tempToken != undefined){
				this.accessToken = tempToken;
			}
		}
	}

	public startRequest(callback) {
		this.callback = callback;
		if(this.accessToken){
			callback(this.accessToken);
			return;
		}

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

	public userInfo(callback:(respondse:object, err?:any)=>any){
		request.get('https://api.github.com/user')
			.set('Authorization',`Bearer `+this.accessToken)
			.set('Accept', 'application/json')
			.end((err, response) => {
				if (err) {
					callback({}, err);
				}
				callback(JSON.parse(response.text));
			});
	}

	public createRepo(name:string = "notableNotes", callback:(err?:any)=>any){
		request.post('https://api.github.com/user/repos')
			.send({
				"name": name,
				"description": "Notable note storage",
				"homepage": "https://notable.ink",
				"private": true,
				"has_issues": false,
				"has_projects": false,
				"has_wiki": false
			})
			.set('Authorization',`Bearer `+this.accessToken)
			.set('Accept', 'application/json')
			.end((err, response)=>{
				if (err) {
					callback(err);
				}
				callback();
			});
	}

	private handleCallback(url) {
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

	private requestGithubToken(code) {
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
			Persist.save("github",{accessToken:this.accessToken});

			this.callback(response.body.access_token, null);
		});
	}

}