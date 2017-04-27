/*
module.exports = function(document, md, rootDir){
	const regex = /!\[(.*)\]\((.*)\)/g;
	
	this.widgets = [];

	this.checkForImage = function(){	
		let m;
		var contents = md.value();
		var lines = contents.split('\n');

		var currentScroll = md.codemirror.getScrollerElement().scrollTop;

		for (var i = 0; i < this.widgets.length; ++i){
			md.codemirror.removeLineWidget(this.widgets[i]);
		}

		this.widgets.length = 0;

		for(var i = 0;i < lines.length;i++){
			while ((m = regex.exec(lines[i])) !== null) {
				// This is necessary to avoid infinite loops with zero-width matches
				if (m.index === regex.lastIndex) {
					regex.lastIndex++;
				}

			   	var container = document.createElement("img");
				this.widgets.push(md.codemirror.addLineWidget(i, container, {
					coverGutter: true
				}));
				md.codemirror.refresh();
				container.src = m[2].replace("{DIR}",rootDir);
			}
		}

		md.codemirror.getScrollerElement().scrollTop = currentScroll;

		return m;
	}
	return this;
};*/

var widgets = require('codemirror-widgets');
var katex = require('katex');

module.exports = function(document, md){
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
			console.log("'"+widget.props.src+"'");
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

	this.preview = function(value){	
		return value;
	}


	return this;
};
