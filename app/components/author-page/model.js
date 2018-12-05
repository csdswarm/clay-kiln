'use strict';

module.exports.render = (ref, data, locals) => {
  // If we're publishing for a dynamic page, switch out -'s with spaces
  let author = '';

  if (locals && locals.params) {
    author = locals.params.author || locals.params.dynamicAuthor;
  }
  data.author = !data.tag && locals && author ? author.replace(/-/g, ' ').replace(/\//g,'') : data.author;
  return data;
};
