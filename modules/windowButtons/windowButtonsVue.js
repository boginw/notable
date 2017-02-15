module.exports = ({
	props:["remote"],
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
	template: `<div class="windows-buttons">
						<div class="windows-button button-minimize enabled" @click="handleMinimize()">
							<div class="icon"></div>
						</div>
						<div class="windows-button button-fullscreen enabled" @click="handleFullscreen()">
							<div class="icon"></div>
						</div>
						<div class="windows-button button-close enabled" @click="handleClose()"></div>
					</div>`,
	methods:{
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