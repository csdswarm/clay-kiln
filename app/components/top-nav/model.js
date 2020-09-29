'use strict';

const { DEFAULT_STATION } = require('../../services/universal/constants');

module.exports.render = (ref, data, locals) => {
  const { radiumUser, station = {} } = locals;

  data.radiumUser = radiumUser;
  if (radiumUser) {
    data.accountUser = radiumUser.first_name || 'My Account';
  }

  if (station.id === DEFAULT_STATION.id) {
    data.headerLinks = data.headerLinks.map((headerLink) => {
      headerLink.current = !!headerLink.url && locals.url.includes(headerLink.url);
      return headerLink;
    });
  }

  return data;
};
