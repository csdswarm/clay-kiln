module.exports = {
  em: function(pixels, browserContext) {
    console.log('in em');
    var browserContext = parseInt(browserContext, 10) || 16;
    var pixels = parseInt(pixels, 10);
    return (pixels / browserContext) + 'em';
  }
};