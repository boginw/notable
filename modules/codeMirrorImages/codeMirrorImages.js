module.exports = function(document, md){
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
				container.src = m[2];
			}
		}

		md.codemirror.getScrollerElement().scrollTop = currentScroll;

		return m;
	}
    return this;
};