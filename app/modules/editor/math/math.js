'use strict';

var widgets = require('codemirror-widgets');
var katex = require('katex');
module.exports = function (document, md) {
    var WidgetMath = widgets.createType({
        mixins: [
            widgets.mixins.re(/\$([^$]+?)\$/g, function (match) {
                return {
                    props: {
                        text: match[1]
                    }
                };
            }),
            widgets.mixins.editParagraph()
        ],
        createElement: function (widget) {
            // Create the spam to replace the formula
            var span = document.createElement('span');
            // Render the formula using katex
            katex.render(widget.props.text, span);
            return span;
        }
    });
    // Create a widgets manager connected to an editor
    var manager = widgets.createManager(md.codemirror);
    // Connect a type of widget to the manager
    manager.enable(WidgetMath);
    var preview = function (plaintext) {
        //plaintext = plaintext.replace(/{DIR}/gm, this.path);
        var m;
        // Math placeholder
        var mathRegex = /\$\$?(.*?)\$?\$/g;
        while ((m = mathRegex.exec(plaintext)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === mathRegex.lastIndex) {
                mathRegex.lastIndex++;
            }
            try {
                plaintext = plaintext.replace(m[0] + "", katex.renderToString(m[1].replace(/\$/gm, "")));
            }
            catch (ignore) { }
        }
        return plaintext;
    };
    return {
        name: 'Math',
        enabled: true,
        preview: preview
    };
};

//# sourceMappingURL=math.js.map