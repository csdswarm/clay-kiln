'use strict';

module.exports.render = function (ref, data, locals) {
  const {callsign} = locals.station;

  // TODO: Fix the following to utilize data retrieved from service being created in ON-722 - CSD
  data.messages = [{
    id: '123456789',
    breaking: true,
    message: 'High speed police chase down US-22 involving 13 incredibly fast Mini Coopers being driven by adolescent deer that somehow look eerily similar to Mark Wahlberg in his mid 20\'s'
  },
  {
    id: '987654321',
    message: `${callsign} WEENIE ROAST LUAU & BEACH PARTY - ON SALE NOW!`
  }];

  return data;
};
