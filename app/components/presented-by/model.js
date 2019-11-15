'use strict';

const { unityComponent } = require('../../services/universal/amphora');


module.exports = unityComponent({
  render: (uri, data) => {
    data._computed.presentedByClasses = 'component component--presented-by presented-by';

    if (data.presenters.length > 5) {
      data._computed.presentedByClasses += ' presented-by--multi-row';
    }

    return data;
  },
  save: (ref, data) => {
    data.displayTitle = data.displayTitle.trim() || 'Presented by';
    return data;
  }
});
