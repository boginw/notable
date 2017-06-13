'use strict';

var widgets = require('codemirror-widgets');
var katex = require('katex');
module.exports = function (document, md) {
    var WidgetImages = widgets.createType({
        mixins: [
            widgets.mixins.re(/!\[([^\]]+)\]\(([^)]+)\)/g, function (match) {
                return {
                    props: {
                        alt: match[1],
                        src: match[2]
                    }
                };
            }),
            widgets.mixins.editParagraph()
        ],
        createElement: function (widget) {
            var img = document.createElement('img');
            img.src = widget.props.src;
            img.alt = widget.props.alt;
            return img;
        }
    });
    var manager = widgets.createManager(md.codemirror);
    manager.enable(WidgetImages);
    var preview = function (plaintext) {
        return plaintext;
    };
    return {
        name: 'Images',
        enabled: true,
        preview: preview
    };
};

//# sourceMappingURL=images.js.map