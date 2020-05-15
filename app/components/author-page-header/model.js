'use strict';

const { assignStationInfo } = require('../../services/universal/create-content'),
  _capitalize = (str) => {
    return str.split(' ').map(([first, ...rest]) => `${first.toUpperCase()}${rest.join('')}`).join(' ');
  },
  socialLinks = [
    {
      type: 'facebook',
      url: 'https://www.facebook.com/{handle}',
      title: 'Follow on Facebook'
    },
    {
      type: 'twitter',
      url: 'https://www.twitter.com/{handle}',
      title: 'Follow on Twitter'
    },
    {
      type: 'instagram',
      url: 'https://www.instagram.com/{handle}',
      title: 'Follow on Instagram'
    },
    {
      type: 'youtube',
      url: 'https://www.youtube.com/{handle}',
      title: 'Subscribe to YouTube Channel'
    },
    {
      type: 'email',
      url: 'mailto:{handle}',
      title: 'Email'
    }
  ];

module.exports.render = (ref, data, locals) => {
  if (locals && locals.params && locals.params.dynamicAuthor) {
    data.author = _capitalize(locals.params.dynamicAuthor.replace(/-/g, ' ').replace(/\//g,''));
    data.dynamic = true;
  }

  data.socialLinks = socialLinks.map(link => {
    const handle = data[link.type];

    if (handle) {
      return { ...link, url: link.url.replace('{handle}', handle) };
    }
  }).filter(updatedLink => updatedLink);

  assignStationInfo(ref, data, locals);

  return data;
};
