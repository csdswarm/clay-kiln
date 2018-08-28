module.exports = {
  em: function(pixels, browserContext) {
    var browserContext = parseInt(browserContext, 10) || 16;
    var pixels = parseInt(pixels, 10);
    return (pixels / browserContext) + 'em';
  },
  widthOnGrid: function(columns, gutters, windowWidth) {
  	var width;
  	switch (windowWidth) {
  		case "medium-screen":
  			width = columns * 101 + gutters * 20;
  			break;
  		case "medium-small-screen":
  			width = columns * 95 + gutters * 20;
  			break;
  		case "small-screen":
  			width = columns * 65 + gutters * 20;
  			break;
  		default:
  			width = columns * 60 + gutters * 20;
  	}
  	return width + 'px';
  }
};
