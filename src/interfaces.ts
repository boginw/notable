
export interface EditorModule {
	name: string;
	enabled: boolean;
	preview(plaintext: string): string;
}

export interface CodeMirror {
	on: (trigger: string, callback: (editor: any, change?: any) => any) => any;
	options: {
		extraKeys: any;
	};
	clearHistory: () => void;
	getDoc: () => any;
	getCursor: () => {line:number, ch:number, sticky:any};
	replaceRange: (code, from, to?, origin?) => any;
	setOption: (option: string, options: any) => any;
}

export interface SimpleMDE {
	value: (contents?: string) => string;
	codemirror: CodeMirror;
	element: HTMLElement;
	gui: object;
	options: {
		previewRender(plaintext: string): string,
	};
	toolbar: object[];
	toolbarElements: object;
	markdown(plaintext: string): string;
	isPreviewActive(): boolean;
	togglePreview(): void;
	isFullscreenActive(): boolean;
	toggleFullScreen(): void;
}

export interface NotableFile {
	name: string;
	extension: string;
	stat: any;
	open: boolean;
	childrens: number;
	preview: string;
}


export interface NoteBook {
	name: string;
	color: string;
	background: string;
}

export interface ExplorerContexts {
	empty: any;
	folder: any;
	file: any;
}

export interface NotableOpenFile {
	(file: NotableFile): void;
}
