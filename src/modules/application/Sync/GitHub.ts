// TypeScript version of 
// https://github.com/uraway/electron-oauth-github
// Extended functionality

const assert = require('assert');
const request = require('superagent');
import GitHubAuth from './GitHubAuth';

export default class GitHub {
	private scopes:string[];
	private clientId:string;
	private clientSecret:string;
	private callback:(access_token:string,err:any)=>any;
	private accessToken:string;

	/**
	 * Default Constructor
	 * @param id Client ID
	 * @param secret Client Secret
	 * @param scopes Scopes to access
	 */
	constructor(id:string, secret:string, scopes:string[]) {
		// Ensure we have all information needed
		assert(id, 'Client ID is needed!');
		assert(secret, 'Client Secret is needed!');
		this.scopes = scopes;
		this.clientId = id;
		this.clientSecret = secret;
	}

	/**
	 * Authenticate user
	 * @param callback Callback to call with access token or error
	 */
	public auth(callback:(access_token:string,err:any)=>any): GitHubAuth{
		return new GitHubAuth(this.clientId, this.clientSecret, this.scopes, (access_token, err) => {
			// Save the access token here
			if(!err){
				this.accessToken = access_token;
			}
			callback(access_token, err);
		});
	}

	/**
	 * Gets the user information from GitHub
	 * @param callback Callback with information
	 */
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

	/**
	 * Creates a repository
	 * @param name Name of the repository
	 * @param callback Callback when created
	 */
	public createRepo(name:string = "notableNotes", callback:(response:any, err?:any)=>any){
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
					callback(response, err);
				}
				callback(response);
			});
	}
}