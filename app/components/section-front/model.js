'use strict';

module.exports.render = (uri, data, locals) => {
  if (data.title) {
    locals.sectionFront = data.title.toLowerCase();
  }

  return data;
};
