'use strict';

const createContent = require('../../services/universal/create-content'),
  { unityComponent } = require('../../services/universal/amphora'),
  dateFormat = require('date-fns/format'),
  dateParse = require('date-fns/parse'),
  { autoLink } = require('../breadcrumbs'),
  /**
   * Format contest dates to include start date and time and end date and time
   *
   * @param {Object} data
   */
  formatContestDate = data => {
    if (data.startDate && data.startTime && data.endDate && data.endTime) {
      data.startDateTime = dateFormat(dateParse(data.startDate + ' ' +
        data.startTime));
      data.endDateTime = dateFormat(dateParse(data.endDate + ' ' +
        data.endTime));
    }
  };

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    await autoLink(data, [
      { slug: data.stationSlug, text: data.stationName },
      { slug: 'contests', text: 'contests' }
    ], locals);
    return createContent.render(uri, data, locals);
  },
  save: (uri, data, locals) => {
    formatContestDate(data);
    return createContent.save(uri, data, locals);
  }
});
