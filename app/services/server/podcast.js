'use strict';
const radioApiService = require('./radioApi'),
  _isEmpty = require('lodash/isEmpty'),

  __ = {
    radioApiService,
    _isEmpty
  };
/**
  * fetch podcast episode data
  * @param {object} locals
  * @param {string} dynamicSlug
  * @returns {Promise<object>}
  */
const getPodcastShow = async (locals, dynamicSlug) => {
    const route = `podcasts?filter[site_slug]=${ dynamicSlug }`,
      { data } = await __.radioApiService.get(route, {}, null, {}, locals);
    
    if (__._isEmpty(data)) {
      return {};
    }
    
    return data[0];
  },

  /**
  * fetch podcast show data
  * @param {object} locals
  * @param {string} dynamicEpisode
  * @returns {Promise<object>}
  */
  getPodcastEpisode = async (locals, dynamicEpisode) => {
    const route = `episodes?filter[episode_site_slug]=${ dynamicEpisode }`,
      { data } = await __.radioApiService.get(route, {}, null, {}, locals);

    if (__._isEmpty(data)) {
      return {};
    }

    return data[0];
  };

module.exports = {
  getPodcastEpisode,
  getPodcastShow,
  _internals: __
};
