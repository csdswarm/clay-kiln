'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  moment = require('moment');

function getFormattedDate(date, time) {
  return date && time ? moment(`${date} ${time}`).format('LLLL') : '';
}

module.exports = unityComponent({
  render: (uri, data) => {
    const lede = {
      dateTime: getFormattedDate(data.lede.startDate, data.lede.startTime),
      addressLink: `https://www.google.com/maps/dir//${ data.lede.venueAddress }`
    };

    data._computed = { lede };

    return data;
  }
});
