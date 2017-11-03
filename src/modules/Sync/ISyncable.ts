import IIO from "../IO/IIO";

export default interface ISyncable extends IIO{
	sync(callback:(err?:any) => void):void;
	
	login(callback:(err?:any) => void):void;
	logout(callback:(err?:any) => void):void;
}