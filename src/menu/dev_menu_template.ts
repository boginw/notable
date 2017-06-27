const { app, BrowserWindow, remote } = require('electron'); // native electron module


export const devMenuTemplate = {
	label: 'Development',
	submenu: [{
		label: 'Reload',
		accelerator: 'CmdOrCtrl+R',
		click: function () {
			remote.getCurrentWindow().webContents.reloadIgnoringCache();
		}
	}, {
		label: 'Toggle DevTools',
		accelerator: 'Alt+CmdOrCtrl+I',
		click: function () {
			remote.getCurrentWindow().toggleDevTools();
		}
	}, {
		label: 'Quit',
		accelerator: 'CmdOrCtrl+Q',
		click: function () {
			remote.getCurrentWindow().close();
		}
	}]
};
