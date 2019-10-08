'use strict';

const createContent = require('../../services/universal/create-content'),
  moment = require('moment'),
  dateFormat = require('date-fns/format'),
  dateParse = require('date-fns/parse'),
  formatContestDate = data => {
    let timezone = 'ET';
    const formatWithTimezone = `MMMM D, YYYY [at] h:mma [${ timezone }]`;

    data.startDateTime = dateFormat(dateParse(data.startDate + ' ' +
      data.startTime));
    data.endDateTime = dateFormat(dateParse(data.endDate + ' ' +
      data.endTime));

    if (data.station) {
      timezone = data.station.timezone;
    }

    data.contestDateRange = `${
      moment(data.startDateTime).format(formatWithTimezone)
    } through ${
      moment(data.endDateTime).format(formatWithTimezone)
    }`;
  };

module.exports.render = function (ref, data, locals) {
  formatContestDate(data);

  return createContent.render(ref, data, locals);
};

module.exports.save = function (uri, data, locals) {
  return createContent.save(uri, data, locals);
};
