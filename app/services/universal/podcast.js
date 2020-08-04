'use strict';

const _get = require('lodash/get'),
  _isEmpty = require('lodash/isEmpty'),
  urlParse = require('url-parse'),
  querystring = require('query-string'),
  stationUtils = require('../server/station-utils');


const

  getStationIdForPodcast = (podcast) => {
    return _get(podcast, 'attributes.station[0].id');
  },

  /**
   * Gets station data for a list of podcasts
   * @param {object} podcasts a list of podcast objects
   * @param {object} locals
   * @returns {Promise<object>} an object containing the station data for the given podcasts, where the key is the id of each station, and the value is the station's data
   */
  getStationsForPodcasts = async (podcasts, locals)=>{
    if (_isEmpty(locals))
      throw new Error('Parameter locals is required');
    else if (_isEmpty(podcasts))
      return {};

    const stationIds = podcasts.map((podcast) => {
      return getStationIdForPodcast(podcast);
    });

    return stationUtils.getSomeStations.byId({ locals, ids: stationIds });
  },


  /**
   * returns a url for a podcast based on the site_slug
   * @param {object} podcast The podcast data
   * @param {object} station the station data
   * @returns {string}
   */
  createUrl = (podcast,station) => {
    const podcast_slug = _get(podcast,'attributes.site_slug'),
      station_slug = _get(station,'attributes.site_slug') || _get(station,'site_slug'); // the response from RDC API provides station.attributes.site_slug, but the response from services/server/station-utils provides station.site_slug

    return '/' + [
      station_slug,
      'podcasts',
      podcast_slug
    ].filter(segment => segment).join('/');
  },

  /**
 * returns a small image url for a podcast
 * @param {string} image
 * @returns {string}
 */
  createImageUrl = image => {
    const baseImage = urlParse(image, true),
      parsedParams = baseImage.query;

    parsedParams['size'] = 'small';
    // eslint-disable-next-line one-var
    const stringParams = querystring.stringify(parsedParams);

    return `${baseImage.origin}${baseImage.pathname}?${stringParams}&`;
  };



module.exports = {
  createImageUrl,
  createUrl,
  getStationIdForPodcast,
  getStationsForPodcasts
};
