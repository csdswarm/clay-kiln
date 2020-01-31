'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  dateFormat = require('date-fns/format'),
  dateParse = require('date-fns/parse'),
  dateFormatString = 'dddd[,] MMMM d [at] h:mm aa';

module.exports = unityComponent({
  render: (uri, data) => {
    console.log('data lede in lede', data.lede);
    const lede = {
      dateTime: data.lede.startDate && data.lede.startTime
        ? dateFormat(dateParse(data.lede.startDate + ' ' + data.lede.startTime),dateFormatString)
        : null,
      addressLink: `https://www.google.com/maps/dir//${ data.lede.venueAddress }`
    };

    data._computed = { lede };

    return data;
  }
});
