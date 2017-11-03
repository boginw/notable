import { SimpleMDE } from "../interfaces";
import IPlugin from './IPlugin';

export default interface IEditorPlugin extends IPlugin {
	preview(plaintext: string): string;
	enable(md: SimpleMDE): void;
	stop(): void;
}