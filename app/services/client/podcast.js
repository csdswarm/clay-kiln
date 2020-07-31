'use strict';

const rest = require('../universal/rest'),
  getPodcastShow = (locals, dynamicSlug) => {
    return rest.get(`/rdc/api/podcast?${dynamicSlug}`);
  },

  getPodcastEpisode = (locals, dynamicEpisode) => {
    return rest.get(`/rdc/api/episode?${dynamicEpisode}`);
  };

module.exports = {
  getPodcastShow,
  getPodcastEpisode
};
