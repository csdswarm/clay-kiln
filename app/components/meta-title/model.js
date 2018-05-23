'use strict';

const sanitize = require('../../services/universal/sanitize');

module.exports.save = (ref, data) => {
  data = sanitize.recursivelyStripSeperators(data);

  data.kilnTitle = data.title;
  data.ogTitle = data.title;

  return data;
};
