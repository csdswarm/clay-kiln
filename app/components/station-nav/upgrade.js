'use strict';

module.exports['1.0'] = (uri, data) => {
  if (typeof data.podcastsUrl === 'undefined') {
    data.podcastsUrl = '/audio';
  }

  if (typeof data.hidePodcastsLink === 'undefined') {
    data.hidePodcastsLink = false;
  }
  return data;
};
