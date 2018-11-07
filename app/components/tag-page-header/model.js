'use strict';

module.exports.render = (ref, data, locals) => {
  // If we're publishing for a dynamic page, switch out -'s with spaces
  data.tag = !data.tag && locals && locals.params && locals.params.tag ? locals.params.tag.replace('/-/g', ' ').replace('/\//g','') : data.tag;
  return data;
};

module.exports.save = function (ref, data) {
  // make sure all of the numbers we need to save aren't strings
  if (data.size) {
    data.size = parseInt(data.size, 10);
  }

  return data;
};
