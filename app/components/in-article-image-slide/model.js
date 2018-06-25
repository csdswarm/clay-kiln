'use strict';
const styles = require('../../services/universal/styles'),
  utils = require('../../services/universal/utils'),
  sanitize = require('../../services/universal/sanitize'),
  striptags = require('striptags'),
  mediaPlay =  require('../../services/universal/media-play');


function sanitizeText(data) {
  if (utils.has(data.imageCaption)) {
    data.imageCaption = sanitize.toSmartText(striptags(data.imageCaption, ['strong', 'em', 'a', 'span']));
  }
  return data;
}

function setSlideRendition(data) {
  var widths = {
      small: 670,
      medium: 800,
      large: 900,
      'extra-large': 1200,
      'super-extra-large': 1600
    },
    aspectRatio = 1.5,
    flexMax = 2147483647,
    imgWidth,
    imgHeight,
    crop;

  if (data.imageURL && data.slideWidth) {

    switch (data.slideDisplay) {
      case 'horizontal':
        imgWidth = widths[data.slideWidth];
        imgHeight = Math.round(imgWidth / aspectRatio);
        crop = true;
        break;
      case 'vertical':
        imgWidth = flexMax;
        imgHeight = Math.round(widths[data.slideWidth] / aspectRatio);
        crop = false;
        break;
      case 'flex':
      default:
        imgWidth = widths[data.slideWidth];
        imgHeight = flexMax;
        crop = false;
        break;
    }

    data.imageURL = mediaPlay.getRenditionUrl(data.imageURL, { w: imgWidth, h: imgHeight, r: '2x' }, crop);
  }
}

module.exports.save = function (uri, data) {
  sanitizeText(data);
  setSlideRendition(data);

  if (!utils.isFieldEmpty(data.sass)) {
    return styles.render(uri, data.sass).then(function (css) {
      data.css = css;
      return data;
    });
  } else {
    data.css = ''; // unset any compiled css
    return Promise.resolve(data); // we don't HAVE to return a promise here, but it makes testing easier
  }
};


