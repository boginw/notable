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
            var span = document.createElement('span');
            katex.render(widget.props.text, span);
            return span;
        }
    });
    var manager = widgets.createManager(md.codemirror);
    manager.enable(WidgetMath);
    var preview = function (plaintext) {
        var m;
        var mathRegex = /\$\$?(.*?)\$?\$/g;
        while ((m = mathRegex.exec(plaintext)) !== null) {
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