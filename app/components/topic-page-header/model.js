'use strict';

module.exports.render = (ref, data, locals) => {
  // If we're publishing for a dynamic page, switch out -'s with spaces
  let tag = '';

  if (locals && locals.params) {
    tag = locals.params.tag || locals.params.dynamicTag;
  }
  data.tag = !data.tag && locals && tag ? tag.replace(/-/g, ' ').replace(/\//g,'').replace(/%26/g, '&') : data.tag;
  return data;
};

module.exports.save = function (ref, data) {
  // make sure all of the numbers we need to save aren't strings
  if (data.size) {
    data.size = parseInt(data.size, 10);
  }

  return data;
};
