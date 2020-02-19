'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  rest = require('../../services/universal/rest'),
  format = require('date-fns/format'),
  addSeconds = require('date-fns/add_seconds'),
  parse = require('date-fns/parse');

/**
 * returns a boolean for if the media is from omny
 *
 * @param {string} url - the url for the media
 *
 * @returns {boolean}
 */
function isImageOmny(url) {
  return url.includes('omnycontent');
}

/**
 * returns a format string to be used with date fns
 *
 * @param {string} durationInSeconds - the duration in second from the api
 *
 * @returns {string}
 */
function getDurationFormat(durationInSeconds) {
  if (durationInSeconds < 60) {
    return 's [s]ec';
  }
  if (durationInSeconds >= 3660) {
    return 'H [h]r m [m]in';
  }
  if (durationInSeconds < 3660 && durationInSeconds >= 3600) {
    return 'H [h]r';
  }
  return 'm [m]in';
}

module.exports = unityComponent({
  /**
   * Updates the data for the template prior to render
   *
   * @param {string} uri - The uri of the component instance
   * @param {object} data - persisted or bootstrapped data for this instance
   * @param {object} locals - data that has been attached to express locals for the current page request
   *
   * @returns {object}
   */
  render: (uri, data) => {
    // NOTE: This will have to be converted to read off of locals instead of a rest call once integrated
    return rest.get(`https://api.radio.com/v1/episodes?filter[published_date]=%5B2019-03-23%2C2020-01-01%5D&filter[publish_state]=Published&page[size]=20&page[number]=1
    `)
      .then(response => {
        data._computed.episodes = response.data.map(podcastData => {
          const startOfDay = new Date(0),
            podcastAttributes = podcastData.attributes,
            durationInSeconds = parseFloat(podcastAttributes.duration_seconds);

          // NOTE: using snake case to stay consistent with api schema
          podcastAttributes.is_image_url_omny = isImageOmny(podcastAttributes.image_url);
          podcastAttributes.published_date_formatted = format(
            parse(podcastAttributes.published_date),
            'MMMM DD, YYYY'
          );
          podcastAttributes.duration_seconds_formatted = format(
            addSeconds(startOfDay, durationInSeconds),
            getDurationFormat(durationInSeconds)
          );
          return podcastData;
        });
        // enable the load more button if it is > 0 and can be evenly divided by 20 as a remainder would signify the end
        data._computed.loadMoreEnabled = data._computed.episodes.length > 0 && data._computed.episodes.length % 20 === 0;
        return data;
      })
      .catch( () => data);
  },

  /**
   * Makes any necessary modifications to data just prior to persisting it
   *
   * @param {string} uri - The uri of the component instance
   * @param {object} data - persisted or bootstrapped data for this instance
   * @param {object} locals - data that has been attached to express locals for the current page request
   *
   * @returns {object}
   */
  save: (uri, data) => {
    return data;
  }
});
