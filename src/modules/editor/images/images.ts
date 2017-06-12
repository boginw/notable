
var widgets = require('codemirror-widgets');
var katex = require('katex');

import {
	EditorModule,
	SimpleMDE
} from '../../../interfaces';

module.exports = function(document:Document, md:SimpleMDE):EditorModule{
	var WidgetImages = widgets.createType({
		mixins: [
			widgets.mixins.re(/!\[([^\]]+)\]\(([^)]+)\)/g, function(match) {
				return {
					props: {
						alt: match[1],
						src: match[2]
					}
				};
			}),
			widgets.mixins.editParagraph()
		],

		createElement: function(widget) {
			// Create the spam to replace the formula
			var img = document.createElement('img');
			img.src = widget.props.src;
			img.alt = widget.props.alt;
			return img;
		}
	});

	// Create a widgets manager connected to an editor
	var manager = widgets.createManager(md.codemirror);

	// Connect a type of widget to the manager
	manager.enable(WidgetImages);

	let preview = function(plaintext:string):string{	
		return plaintext;
	}

	return <EditorModule>{
		name: 'Images',
		enabled: true,
		preview:preview
	};
};
