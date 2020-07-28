'use strict';

const createContent = require('../../services/universal/create-content'),
  { unityComponent } = require('../../services/universal/amphora'),
  { autoLink } = require('../breadcrumbs'),
  /**
   * Format contest dates to include start date and time and end date and time
   *
   * @param {Object} data
   */
  formatContestDate = data => {
    if (data.startDate && data.startTime && data.endDate && data.endTime) {
      data.startDateTime = data.startDate + 'T' + data.startTime;
      data.endDateTime = data.endDate + 'T' + data.endTime;
    }
  };

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    await autoLink(data, [
      { slug: 'contests', text: 'contests' }
    ], locals);
    return createContent.render(uri, data, locals);
  },
  save: (uri, data, locals) => {
    formatContestDate(data);
    return createContent.save(uri, data, locals);
  }
});
