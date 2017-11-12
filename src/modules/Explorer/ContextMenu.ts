const { remote } = require('electron');
const { Menu, MenuItem, shell } = remote;

import Events from '../Events/Events';

export default [
	{
		label: 'New Folder',
		role: 'newFolder',
		click: () => {
			Events.trigger('file.newFolder');
		},
	}, {
		label: 'New Note',
		role: 'new',
		click: () => {
			Events.trigger('file.newFile');
		},
	}
];

