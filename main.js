const electron = require('electron');
const {app, Menu, shell} = electron;
const BrowserWindow = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut;
const path = require('path');
const url = require('url');
const fs = require("fs");
const windowStateKeeper = require('electron-window-state');
const Config = require('electron-config')
const config = new Config();
let {mainBroadcastListener} = require('electron-ipc-broadcast');

mainBroadcastListener();

let mainWindow;

if(!fs.existsSync('notes/')){
	fs.mkdirSync("notes");
}

if(!fs.existsSync('notes/init.md')){
	fs.writeFile('notes/init.md',"# Hello", function(err) {
		if(err) {
		    return console.log(err);
		}
		console.log("The file was saved! "+path);
	});
}

function createWindow () {
	// Load last window state
	let mainWindowState = windowStateKeeper({
	    defaultWidth: 1000,
	    defaultHeight: 800
	});

	// Create the browser window.
	mainWindow = new BrowserWindow({
		'x': mainWindowState.x,
		'y': mainWindowState.y,
		'width': mainWindowState.width,
		'height': mainWindowState.height,
		frame: false
	});

	// and load the index.html of the app.
	mainWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, 'app/index.html'),
			protocol: 'file:',
			slashes: true
		})
	);

	mainWindow.once('ready-to-show', mainWindow.show);

	mainWindowState.manage(mainWindow);

	// Open the DevTools.
	// mainWindow.webContents.openDevTools();

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {

		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
}
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});