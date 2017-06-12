let cp = require('child_process');
let {webFrame} = require('electron');

export default class ZoomFactor{
    distroRegExp:RegExp = /NAME="([A-z]+)"/gm;

    /**
     * Zoom to the defined scale (Linux specific)
     * @param {number} scale Scale to zoom to
     */
    zoom():void;
    zoom(scale?:number):void{
        if(scale){
            webFrame.setZoomFactor(scale);
        }else if(process.platform == "linux"){
            var releaseString:string = String(cp.execSync("cat /etc/*-release"));
            var distro:string[] = this.distroRegExp.exec(releaseString);
            if(distro.length && distro[1] == "Ubuntu"){
                var scalingArray:number[] = cp.execSync("gsettings get org.gnome.desktop.interface text-scaling-factor");
                var scaling:number = Number.parseFloat(String(scalingArray));
                webFrame.setZoomFactor(scaling);
                // Let the user know that the view has scaled
                console.log(`You're running Linux (${distro[1]}) \
                            with text-scaling-factor set to ${scaling}\
                            So we've scaled the Window to the same scaling.`);
            }
        }
    }
}