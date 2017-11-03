import GitHub from './GitHub';
import Persist from '../Persist/Persist';
import LicenceAgree from './LicenceAgree';
import env from '../../env';

export default class Sync {

	private github: GitHub;

	constructor() {
		let settings: any = Persist.load("sync");

		if (settings.hasAgreed !== true) {
			let l = new LicenceAgree(()=>{
				this.gitHubAuth();
			});
		}
	}

	private gitHubAuth(){
		this.github = new GitHub(
			env.github_id,
			env.github_secret,
			['user','user:email', 'repo']
		);

		this.github.auth((access_token, err) => {
			if (err) {
				console.error(err);
			}

			this.hasPrivateRepoAccess((has)=>{
				alert("You're now logged in. Sync features pending...");
			});
		});
	}

	private hasPrivateRepoAccess(callback:(has:boolean)=>any){
		this.github.userInfo((response:any, err) => {
			if(err){
				console.error(err);
				return;
			}
			
			let has:boolean = false;
			
			if(response.plan.private_repos > response.owned_private_repos){
				has = true;
			}

			callback(has);
		});
	}

}