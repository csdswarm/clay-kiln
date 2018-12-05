'use strict';

module.exports.render = (ref, data, locals) => {
  if (locals.params) {
    data.author = byline.slugToAuthorName(locals.params.dynamicAuthor);
  }
  return data;
};
