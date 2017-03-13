var widgets = require('codemirror-widgets');
var katex = require('katex');

module.exports = function(document, md, rootDir){
	var WidgetMath = widgets.createType({
	    mixins: [
	        widgets.mixins.re(/\$([^$]+?)\$/g, function(match) {
	            return {
	                props: {
	                    text: match[1]
	                }
	            };
	        }), 
	        widgets.mixins.editParagraph()
	    ],

	    createElement: function(widget) {
	        // Create the spam to replace the formula
	        var span = document.createElement('span');

	        // Render the formula using katex
	        katex.render(widget.props.text, span)

	        return span;
	    }
	});

	// Create a widgets manager connected to an editor
	var manager = widgets.createManager(md.codemirror);

	// Connect a type of widget to the manager
	manager.enable(WidgetMath);

    return this;
};
