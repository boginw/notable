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