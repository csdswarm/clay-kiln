'use strict';

const
  _get = require('lodash/get'),
  createContent = require('../../services/universal/create-content'),
  { assignStationInfo } = require('../../services/universal/create-content'),
  { getComponentInstance } = require('clayutils'),
  { unityComponent } = require('../../services/universal/amphora'),

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

module.exports = unityComponent({
  render: (ref, data, locals) => {
    if (_get(locals, 'params.author') && _get(data, '_computed.dynamic')) {
      data.author = _capitalize(locals.params.author.replace(/-/g, ' ').replace(/\//g,''));
    }
    data._computed.dynamic = getComponentInstance(ref) === 'new';
    data._computed.socialLinks = socialLinks.map(link => {
      const handle = data[link.type];

      if (handle) {
        return { ...link, url: link.url.replace('{handle}', handle) };
      }
    }).filter(updatedLink => updatedLink);

    assignStationInfo(ref, data, locals);

    return data;
  }
});

module.exports.save = (ref, data, locals) => createContent.save(ref, data, locals);
