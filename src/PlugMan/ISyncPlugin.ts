import IPlugin from './IPlugin';
import IIO from "../modules/IO/IIO";

export default interface ISyncPlugin extends IPlugin, IIO {
	sync():Promise<void>;
	login():Promise<void>;
	logout():Promise<void>;
	isLoggedIn():Promise<boolean>;
}