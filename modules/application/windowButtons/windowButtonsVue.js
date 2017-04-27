module.exports = ({
	props:["remote","left"],
	data(){
		return {
			fullscreen: false,
			isWindows: true,
			isLinux: false
		}
	},
	created(){
		this.isWindows = process.platform == "win32";
		this.isLinux   = process.platform == "linux";
		this.fullscreen = remote.getCurrentWindow().isMaximized() ||
						  remote.getCurrentWindow().isFullScreen()
	},
	template: `
				<div>
					<div class="logo" v-if="(left && isWindows) || (!left && !isWindows)"><img src="img/logo.png" width="30" height="30" @click="handleLogo()"></div>

					<div v-bind:class="{'windows-buttons': isWindows, buttons: !isWindows}" v-if="(isWindows && !left) || (left && !isWindows)">
						<div class="button-minimize enabled" v-if="isWindows" @click="handleMinimize()" v-bind:class="{'windows-button': isWindows, button: !isWindows}">
							<div class="icon"></div>
						</div>
						<div class="button-fullscreen enabled" @click="handleFullscreen()" v-bind:class="{'windows-button': isWindows, button: !isWindows}">
							<div class="icon"></div>
						</div>
						<div class="button-minimize enabled" v-if="!isWindows" @click="handleMinimize()" v-bind:class="{'windows-button': isWindows, button: !isWindows}">
							<div class="icon"></div>
						</div>
						<div class="button-close enabled" @click="handleClose()" v-bind:class="{'windows-button': isWindows, button: !isWindows}"></div>
					</div>
				</div>`,
	methods:{
		handleLogo() {
			if(document.md.isPreviewActive()){
				document.md.togglePreview();
			}

			if(document.md.isFullscreenActive()){
				document.md.toggleFullScreen();
			}
		},
		handleClose() {
			if (this.isWindows) {
				remote.getCurrentWindow().close();
			} else {
				remote.getCurrentWindow().hide();
			}
		},
		handleMinimize() {
			remote.getCurrentWindow().minimize();
		},
		handleFullscreen: function () {
			if (this.isWindows || this.isLinux) {
				if (remote.getCurrentWindow().isMaximized()) {
					remote.getCurrentWindow().unmaximize();
				} else {
					remote.getCurrentWindow().maximize();
				}

				this.fullscreen = remote.getCurrentWindow().isMaximized();
			} else {
				remote.getCurrentWindow().setFullScreen(!remote.getCurrentWindow().isFullScreen());
				this.fullscreen = remote.getCurrentWindow().isFullScreen()
			}
		},
	}
});