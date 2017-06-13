export interface EditorModule{
    name:string;
    enabled:boolean;
    preview(plaintext:string):string;
}

export interface SimpleMDE{
    codemirror:object;
    element:HTMLElement;
    gui:object;
    options:{
        previewRender(plaintext: string): string,
    };
    toolbar:object[];
    toolbarElements:object;
    markdown(plaintext:string):string;
    isPreviewActive():boolean;
    togglePreview():void;
    isFullscreenActive():boolean;
    toggleFullScreen():void;
}

export interface NotableFile{
    name:string;
    extension:string;
    stat:any,
    open:boolean;
    childrens:NotableFile[];
	preview:string;
}


export interface NoteBook{
    name:string;
    color:string;
    background:string;
}

export interface ExplorerContexts{
    empty:any;
    folder:any;
    file:any;
}

export interface NotableOpenFile{
    (file:NotableFile):void;
}