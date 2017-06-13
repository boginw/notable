var widgets = require('codemirror-widgets');
var katex = require('katex');

import {
	EditorModule,
	SimpleMDE
} from '../../../interfaces';

module.exports = function(document:Document, md:SimpleMDE):EditorModule{
	var WidgetMath = widgets.createType({
	    mixins: [
	        widgets.mixins.re(/\$([^$]+?)\$/g, function(match:string[]) {

	            return {
	                props: {
	                    text: match[1]
	                }
	            };
	        }), 
	        widgets.mixins.editParagraph()
	    ],

	    createElement: function(widget:any):HTMLElement {
	        // Create the spam to replace the formula
	        var span:HTMLElement = document.createElement('span');

	        // Render the formula using katex
	        katex.render(widget.props.text, span)

	        return span;
	    }
	});

	// Create a widgets manager connected to an editor
	var manager = widgets.createManager(md.codemirror);

	// Connect a type of widget to the manager
	manager.enable(WidgetMath);

	let preview = function(plaintext:string):string{
		//plaintext = plaintext.replace(/{DIR}/gm, this.path);
        let m:any;
		// Math placeholder
		const mathRegex = /\$\$?(.*?)\$?\$/g;
		while ((m = mathRegex.exec(plaintext)) !== null) {
		    // This is necessary to avoid infinite loops with zero-width matches
		    if (m.index === mathRegex.lastIndex) {
		        mathRegex.lastIndex++;
		    }
		    try{
		    	plaintext = plaintext.replace(m[0]+"", katex.renderToString(m[1].replace(/\$/gm,"")));
		    }catch(ignore){}
		}
		return plaintext;
	}


	return <EditorModule>{
		name: 'Math',
		enabled: true,
		preview: preview
	};
};
