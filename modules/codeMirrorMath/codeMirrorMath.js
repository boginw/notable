module.exports = function(document, md, rootDir){
	const regex = /\$\$?(.*?)\$?\$/g;

	document.widgets = [];

	this.checkForMath = function(){	
		let m;
		var contents = md.value();
		var lines = contents.split('\n');

		var currentScroll = md.codemirror.getScrollerElement().scrollTop;

		

		for(var i = 0;i < lines.length;i++){
			while ((m = regex.exec(lines[i])) !== null) {
			    // This is necessary to avoid infinite loops with zero-width matches
			    if (m.index === regex.lastIndex) {
			        regex.lastIndex++;
			    }

			   	var container = document.createElement("p");

				document.widgets.push(md.codemirror.addLineWidget(i, container, {
			        coverGutter: true
			    }));
			    md.codemirror.refresh();


			   	try{
			    	container.innerHTML = (m[0]+"", katex.renderToString(m[1].replace(/\$/gm,"")));
			    }catch(ignore){}
			}
		}

		md.codemirror.getScrollerElement().scrollTop = currentScroll;

		return m;
	}
    return this;
};