'use strict';

module.exports.render = (ref, data, locals) => {
  data.station = locals.station;

  data.socialButtons = [];
  const buttons = {
    facebook: (url) => url,
    twitter: (id) => `https://twitter.com/${id}`,
    youtube: (url) => url,
    instagram: (url) => url
  };

  Object.keys(buttons).forEach(type => {
    const url = data.station[type];

    if (url) {
      data.socialButtons.push({ type, url: buttons[type](url) });
    }
  });

  return data;
};
