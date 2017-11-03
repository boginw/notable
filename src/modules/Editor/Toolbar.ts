const SimpleMDE = require('simplemde');


export default [
	{
		name: "bold",
		action: SimpleMDE.toggleBold,
		className: "material-icons large bold",
		title: "Bold",
		default: true
	},
	{
		name: "italic",
		action: SimpleMDE.toggleItalic,
		className: "material-icons large italic",
		title: "Italic",
		default: true
	},
	{
		name: "strikethrough",
		action: SimpleMDE.toggleStrikethrough,
		className: "material-icons large strikethrough",
		title: "Strikethrough"
	},
	{
		name: "heading",
		action: SimpleMDE.toggleHeadingSmaller,
		className: "material-icons large title",
		title: "Title",
		default: true
	},
	"|",
	{
		name: "code",
		action: SimpleMDE.toggleCodeBlock,
		className: "material-icons large code",
		title: "Code"
	},
	{
		name: "quote",
		action: SimpleMDE.toggleBlockquote,
		className: "material-icons large quote",
		title: "Quote",
		default: true
	},
	{
		name: "unordered-list",
		action: SimpleMDE.toggleUnorderedList,
		className: "material-icons large list-ul",
		title: "Generic List",
		default: true
	},
	{
		name: "ordered-list",
		action: SimpleMDE.toggleOrderedList,
		className: "material-icons large list-ol",
		title: "Numbered List",
		default: true
	},
	"|",
	{
		name: "link",
		action: SimpleMDE.drawLink,
		className: "material-icons large link",
		title: "Create Link",
		default: true
	},
	{
		name: "image",
		action: SimpleMDE.drawImage,
		className: "material-icons large photo",
		title: "Insert Image",
		default: true
	},
	{
		name: "table",
		action: SimpleMDE.drawTable,
		className: "material-icons large table",
		title: "Insert Table"
	},
	{
		name: "horizontal-rule",
		action: SimpleMDE.drawHorizontalRule,
		className: "material-icons large horizontal-rule",
		title: "Insert Horizontal Line"
	},
	"|",
	{
		name: "preview",
		action: SimpleMDE.togglePreview,
		className: "material-icons large preview no-disable",
		title: "Toggle Preview",
		default: true
	},
	{
		name: "side-by-side",
		action: SimpleMDE.toggleSideBySide,
		className: "material-icons large side-by-side no-disable no-mobile",
		title: "Toggle Side by Side",
		default: true
	},
	{
		name: "fullscreen",
		action: SimpleMDE.toggleFullScreen,
		className: "material-icons large fullscreen no-disable no-mobile",
		title: "Toggle Fullscreen",
		default: true
	},
	/*"|",
	{
		name: "undo",
		action: SimpleMDE.undo,
		className: "material-icons large undo no-disable",
		title: "Undo"
	},
	{
		name: "redo",
		action: SimpleMDE.redo,
		className: "material-icons large redo no-disable",
		title: "Redo"
	},*/
	"|",
	{
		name: "print",
		action: () => { alert("Not ready yet..."); },
		className: "material-icons large print",
		title: "Print"
	}
];