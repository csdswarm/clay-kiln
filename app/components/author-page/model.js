'use strict';

const byline = require('../../services/universal/byline');

module.exports.render = (ref, data, locals) => {
  data.author = byline.slugToAuthorName(locals.params.dynamicAuthor);
  return data;
};
