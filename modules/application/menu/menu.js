/**
 * Creates a default menu for electron apps
 *
 * @param {Object} app electron.app
 * @param {Object} shell electron.shell
 * @returns {Object}	a menu object to be passed to electron.Menu
 */

module.exports = function(app, shell, document, BrowserWindow, dialog) {

	const template = [
		{
			label: 'File',
			submenu:[
				{
					label: 'New File',
					accelerator: 'CmdOrCtrl+N',
					role: 'new',
					click: ()=>{
						document.explorerFrontend.newFile();
					}
				},
				{
					label: 'New Folder',
					accelerator: 'CmdOrCtrl+Shift+N',
					role: 'new',
					click: ()=>{
						document.createFolderDialog();
					}
				},
				{
					label: 'Open File',
					accelerator: 'CmdOrCtrl+O',
					role: 'open',
					click: () => {
						let path = dialog.showOpenDialog({
								properties: ['openFile']
						});
						if(path != undefined){
							document.openFile(path[0]);
						}else{
							alert("Could not open file");
						}
					}
				},
				{
					label: 'Save',
					accelerator: 'CmdOrCtrl+S',
					role: 'save',
					click: ()=>{
						document.explorerFrontend.saveCurrentFile();
					}
				}
			]
		},
		{
			label: 'Edit',
			submenu: [
				{
					label: 'Undo',
					accelerator: 'CmdOrCtrl+Z',
					role: 'undo'
				},
				{
					label: 'Redo',
					accelerator: 'Shift+CmdOrCtrl+Z',
					role: 'redo'
				},
				{
					type: 'separator'
				},
				{
					label: 'Cut',
					accelerator: 'CmdOrCtrl+X',
					role: 'cut'
				},
				{
					label: 'Copy',
					accelerator: 'CmdOrCtrl+C',
					role: 'copy'
				},
				{
					label: 'Paste',
					accelerator: 'CmdOrCtrl+V',
					role: 'paste'
				},
				{
					label: 'Select All',
					accelerator: 'CmdOrCtrl+A',
					role: 'selectall'
				},
			]
		},
		{
			label: 'View',
			submenu: [
				{
					label: 'Reload',
					accelerator: 'CmdOrCtrl+R',
					click: function(item, focusedWindow) {
						if (focusedWindow)
							focusedWindow.reload();
					}
				},
				{
					label: 'Toggle Developer Tools',
					accelerator: (function() {
						if (process.platform === 'darwin')
							return 'Alt+Command+I';
						else
							return 'Ctrl+Shift+I';
					})(),
					click: function(item, focusedWindow) {
						if (focusedWindow)
							focusedWindow.toggleDevTools();
					}
				},
			]
		}
	];

	if (process.platform === 'darwin') {
		const name = app.getName();
		template.unshift({
			label: name,
			submenu: [
				{
					label: 'About ' + name,
					role: 'about'
				},
				{
					type: 'separator'
				},
				{
					label: 'Services',
					role: 'services',
					submenu: []
				},
				{
					type: 'separator'
				},
				{
					label: 'Hide ' + name,
					accelerator: 'Command+H',
					role: 'hide'
				},
				{
					label: 'Hide Others',
					accelerator: 'Command+Shift+H',
					role: 'hideothers'
				},
				{
					label: 'Show All',
					role: 'unhide'
				},
				{
					type: 'separator'
				},
				{
					label: 'Quit',
					accelerator: 'Command+Q',
					click: function() { app.quit(); }
				},
			]
		});
		const windowMenu = template.find(function(m) { return m.role === 'window' })
		if (windowMenu) {
			windowMenu.submenu.push(
				{
					type: 'separator'
				},
				{
					label: 'Bring All to Front',
					role: 'front'
				}
			);
		}
	}

	Menu.setApplicationMenu(Menu.buildFromTemplate(template));

	  const InputMenu = Menu.buildFromTemplate([{
	        label: 'Undo',
	        role: 'undo',
	    }, {
	        label: 'Redo',
	        role: 'redo',
	    }, {
	        type: 'separator',
	    }, {
	        label: 'Cut',
	        role: 'cut',
	    }, {
	        label: 'Copy',
	        role: 'copy',
	    }, {
	        label: 'Paste',
	        role: 'paste',
	    }, {
	        type: 'separator',
	    }, {
	        label: 'Select all',
	        role: 'selectall',
	    },
	]);

	document.body.addEventListener('contextmenu', (e) => {
	    e.preventDefault();
	    e.stopPropagation();

	    let node = e.target;

	    while (node) {
	        if (hasClassName("CodeMirror", node.className)) {
	            InputMenu.popup(remote.getCurrentWindow());
	            break;
	        }
	        node = node.parentNode;
	    }
	});

	return template;
}