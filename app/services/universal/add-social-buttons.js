'use strict';

const buttons = {
  facebook: url => url,
  twitter: id => `https://twitter.com/${id}`,
  youtube: url => url,
  instagram: url => url
};

module.exports = data => {
  data.socialButtons = Object.keys(buttons)
    .filter(type => data.station[type])
    .map(type => ({ type, url: buttons[type](data.station[type]) }));
};
