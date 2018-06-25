'use strict';
const styles = require('../../services/universal/styles'),
  utils = require('../../services/universal/utils');

module.exports.save = function (uri, data) {

  // compile styles if they're not empty
  if (!utils.isFieldEmpty(data.sass)) {
    return styles.render(uri, data.sass).then(function (css) {
      data.css = css;
      return data;
    });
  } else {
    data.css = ''; // unset any compiled css
    return data;
  }
};


