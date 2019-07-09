'use strict';

module.exports.render = (uri, data, locals) => {
  if (data.title) {

    if (data.primary) {
      locals.sectionFront = data.title.toLowerCase();
    } else {
      locals.sectionFront = data.primarySectionFront;
      locals.secondarySectionFront = data.title.toLowerCase();
    }
  }

  return data;
};
