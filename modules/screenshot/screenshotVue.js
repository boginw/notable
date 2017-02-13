module.exports = ({
	props:["remote","BrowserWindow","document","rootdir"],
	template:`<span class="btn-sidebar btn-preferences" @click="screenshot()">
							<i class="icon material-icons">camera_enhance</i>
						</span>`,
	methods:{
		getDate(){
			var today = new Date();
			var dd = today.getDate();
			var MM = today.getMonth()+1;
			var hh = today.getHours();
			var mm = today.getMinutes();
			var ss = today.getSeconds();

			var yyyy = today.getFullYear();
			if(dd<10){
			    dd='0'+dd;
			} 
			if(mm<10){
			    mm='0'+mm;
			} 
			var today = hh+'.'+mm+'.'+ss+'-'+dd+'-'+MM+'-'+yyyy;

			return today;
		},
		fullscreenScreenshot(callback, imageFormat){
		    var _this = this;
		    this.callback = callback;
		    imageFormat = imageFormat || 'image/jpeg';
		    
		    this.handleStream = (stream) => {
		        // Create hidden video tag
		        var video = document.createElement('video');
		        video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';
		        // Event connected to stream
		        video.onloadedmetadata = function () {
		            // Set video ORIGINAL height (screenshot)
		            video.style.height = this.videoHeight + 'px'; // videoHeight
		            video.style.width = this.videoWidth + 'px'; // videoWidth

		            // Create canvas
		            var canvas = document.createElement('canvas');
		            canvas.width = this.videoWidth;
		            canvas.height = this.videoHeight;
		            var ctx = canvas.getContext('2d');
		            // Draw video on canvas
		            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		            if (_this.callback) {
		                // Save screenshot to base64
		                _this.callback(canvas.toDataURL(imageFormat));
		            } else {
		                console.log('Need callback!');
		            }

		            // Remove hidden video tag
		            video.remove();
		            try {
		                // Destroy connect to stream
		                stream.getTracks()[0].stop();
		            } catch (e) {}
		        }
		        video.src = URL.createObjectURL(stream);
		        document.body.appendChild(video);
		    };

		    this.handleError = function(e) {
		        console.log(e);
		    };

		    // Filter only screen type
		    desktopCapturer.getSources({types: ['screen']}, (error, sources) => {
		        if (error) throw error;
		        // console.log(sources);
		        for (let i = 0; i < sources.length; ++i) {
		            console.log(sources);
		            // Filter: main screen
		            if (sources[i].name === "Entire screen") {
		                navigator.webkitGetUserMedia({
		                    audio: false,
		                    video: {
		                        mandatory: {
		                            chromeMediaSource: 'desktop',
		                            chromeMediaSourceId: sources[i].id,
		                            minWidth: 1280,
		                            maxWidth: 4000,
		                            minHeight: 720,
		                            maxHeight: 4000
		                        }
		                    }
		                }, this.handleStream, this.handleError);

		                return;
		            }
		        }
		    });
		},
		screenshot(){
			console.log("taking screenshot");
			remote.getCurrentWindow().hide();
			var rootdir = this.rootdir;
			this.fullscreenScreenshot((dat)=>{

				var currentTime = this.getDate();
				// Create the browser window.
				screenshotWindow = new BrowserWindow({
					fullscreen: true,
					frame: false
				});

				// and load the index.html of the app.
				screenshotWindow.loadURL(
					require("url").format({
						pathname: require("path").join(document.__dirname, '/cropper.html'),
						protocol: 'file:',
						slashes: true
					})
				);

				screenshotWindow.webContents.on('did-finish-load', () => {
					screenshotWindow.webContents.send('store-data', "scr_"+currentTime+".png");
				});

				screenshotWindow.webContents.on('cropped', () => {
					document.md.value(document.md.value()+"\n![screenshot]({DIR}/scr_"+currentTime+".png)");
					remote.getCurrentWindow().show();

					screenshotWindow = null;
				});

				var base64Data = dat.replace(/^data:image\/png;base64,/, "");
				require("fs").writeFile(rootdir+"notes/scr_"+currentTime+".png", base64Data, 'base64', function(err) {
					if(err)
						console.log(err);
				}).bind(this);

			}, 'image/png');
		},
	}
});