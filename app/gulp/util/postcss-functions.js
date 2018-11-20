'use strict';

module.exports = {
  em: function (pixels, browserContext) {
    var browserContext = parseInt(browserContext, 10) || 16,
      pixels = parseFloat(pixels);

    return pixels / browserContext + 'em';
  },
  widthOnGrid: function (columns, gutters, windowWidth) {
  	var width;

  	switch (windowWidth) {
  		case 'medium-screen': // 481 to 1023px screen width
  			width = columns * 101 + gutters * 20;
  			break;
  		case 'medium-small-screen': // 361 to 480px screen width
  			width = columns * 95 + gutters * 20;
  			break;
  		case 'small-screen': // 360px and below screen width
  			width = columns * 65 + gutters * 20;
  			break;
  		default: // 1023px and above screen width
  			width = columns * 60 + gutters * 20;
  	}
  	return width + 'px';
  }
};
