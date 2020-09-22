'use strict';

module.exports = function stripEot(text = '') {
  return text.replace('\u0004', '');
};

