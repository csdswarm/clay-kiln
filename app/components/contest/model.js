'use strict';

const createContent = require('../../services/universal/create-content'),
  dateFormat = require('date-fns/format'),
  dateParse = require('date-fns/parse'),
  /**
   * Format contest dates to include start date and time and end date and time
   *
   * @param {Object} data
   */
  formatContestDate = data => {
    data.timezone = 'ET';

    if (data.station) {
      data.timezone = data.station.timezone;
    }

    if (data.startDate && data.startTime && data.endDate && data.endTime) {
      data.startDateTime = dateFormat(dateParse(data.startDate + ' ' +
        data.startTime));
      data.endDateTime = dateFormat(dateParse(data.endDate + ' ' +
        data.endTime));
    }
  };

module.exports.render = function (ref, data, locals) {
  formatContestDate(data);

  return createContent.render(ref, data, locals);
};

module.exports.save = function (uri, data, locals) {
  return createContent.save(uri, data, locals);
};
