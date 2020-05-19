'use strict';
const { unityComponent } = require('../../services/universal/amphora');


module.exports = unityComponent({
  render: (uri, data, locals) => {
    if (data.title) {

      if (data.primary) {
        locals.sectionFront = data.title.toLowerCase();
      } else {
        locals.sectionFront = data.primarySectionFront;
        locals.secondarySectionFront = data.title.toLowerCase();
      }
    }

    return data;
  }
});
