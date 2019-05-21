'use strict';

module.exports.render = (uri, data, locals) => {
  if (data.title) {
    if (data.primary) {
      locals.sectionFront = data.title;
    } else {
      locals.secondarySectionFront = data.title;
    }
  }
  return data;
};
