
export interface EditorModule{
    name:string;
    enabled:boolean;
    preview(plaintext:string):string;
}

export interface CodeMirror{
    on:(trigger:string,callback:(editor:any,change?:any)=>any)=>any;
    options:{
        extraKeys:any;
    };
    setOption:(option:string,options:any)=>any;
}

export interface SimpleMDE{
    codemirror:CodeMirror;
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
    value:(contents?:string) => string;
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
