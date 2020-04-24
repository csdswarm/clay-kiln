'use strict';

const _get = require('lodash/get'),
  buttons = {
    facebook: url => url,
    twitter: id => `https://twitter.com/${id}`,
    youtube: url => url,
    instagram: url => url
  };

module.exports = data => {
  data._computed.socialButtons = Object.keys(buttons)
    .filter(type => _get(data, `_computed.station[${type}]`))
    .map(type => ({ type, url: buttons[type](data._computed.station[type]) }));
};
