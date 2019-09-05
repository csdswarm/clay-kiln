'use strict';

module.exports.render = (ref, data, locals) => {
  let author = '';

  if (locals && locals.params) {
    author = locals.params.author || locals.params.dynamicAuthor;
  }

  data.author = author.replace(/-/g, ' ').replace(/\//g,'');
  return data;
};