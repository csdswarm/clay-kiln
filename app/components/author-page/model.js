'use strict';

module.exports.render = (ref, data, locals) => {
  if (locals.params && locals.params.dynamicAuthor) {
    data.author = locals.params.dynamicAuthor.replace(/-/g, ' ').replace(/\//g,'');
  }
  return data;
};
