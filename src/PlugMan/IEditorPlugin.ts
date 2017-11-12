import { SimpleMDE } from "../interfaces";
import IPlugin from './IPlugin';
import Editor from '../modules/Editor/Editor';

export default interface IEditorPlugin extends IPlugin {
	contains(plaintext: string): boolean;
	preview(plaintext: string): string;
	enable(editor: Editor): void;
	stop(): void;
}