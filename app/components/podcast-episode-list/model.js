'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  rest = require('../../services/universal/rest'),
  format = require('date-fns/format'),
  addSeconds = require('date-fns/add_seconds'),
  parse = require('date-fns/parse');

function isImageOmny(url) {
  return url.includes('omnycontent');
}

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
        data._computed.podcasts = response.data.map(podcastData => {
          const startOfDay = new Date(0),
            durationInSeconds = parseFloat(podcastData.attributes.duration_seconds);

          // NOTE: using snake case to stay consistent with api schema
          podcastData.attributes.is_image_url_omny = isImageOmny(podcastData.attributes.image_url);
          podcastData.attributes.published_date_formatted = format(
            parse(podcastData.attributes.published_date),
            'MMMM DD, YYYY'
          );
          podcastData.attributes.duration_seconds_formatted = format(
            addSeconds(startOfDay, durationInSeconds),
            getDurationFormat(durationInSeconds)
          );
          return podcastData;
        });
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
