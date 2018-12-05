'use strict';

module.exports.render = (ref, data, locals) => {
  if (locals.params) {
    data.author = locals.params.dynamicAuthor.replace(/-/g, ' ').replace(/\//g,'');
  }
  return data;
};
