'use strict';
const { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  render: (uri, data, locals) => {
    const { edit, sectionFront, station } = locals;
    let dividerClass = ' ';

    if (edit) {
      dividerClass += 'editing ';
    }
    if (sectionFront) {
      dividerClass += `divider--${sectionFront} `;
    }
    if (station.id) {
      dividerClass += 'divider--station-front ';
    }

    data._computed = {
      dividerClass
    };
    return data;
  }
});
