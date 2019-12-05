'use strict';

module.exports.render = (ref, data, locals) => {
  // If we're publishing for a dynamic page, switch out -'s with spaces
  let title = '';

  if (locals && locals.params) {
    title = locals.params.tag || locals.params.dynamicTag;
  }

  // eslint-disable-next-line no-extra-parens
  data.title = (!data.title && locals && title) ? title.replace(/-/g, ' ').replace(/\//g,'').replace(/%26/g, '&') : data.title;

  return data;
};

module.exports.save = function (ref, data) {
  // make sure all of the numbers we need to save aren't strings
  if (data.size) {
    data.size = parseInt(data.size, 10);
  }

  return data;
};
