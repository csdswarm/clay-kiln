'use strict';

const queryService = require('../../services/server/query'),
  utils = require('../../services/universal/podcast'),
  podcastByPopularity = 'http://api.radio.com/v1/podcasts?sort=popularity',
  maxItems = 4,
  /**
   * determines if the array of podcast items contains a url
   * @param {object} arr
   * @param {string} url
   * @returns {boolean}
   */
  containsUrl = (arr, url) => arr.some(item => item.podcast.url === url);

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = function (ref, data, locals) {
  if (data.items.length === maxItems || !locals || locals.edit) {
    return new Promise((resolve) => resolve(data));
  }

  return fetch(podcastByPopularity)
    .then((response) => response.json())
    .then((json) => {

      json.data.splice(0, maxItems).forEach((podcast) => {
        const url = utils.createUrl(podcast.attributes.title);

        if (data.items.length !== maxItems && !containsUrl(data.items, url)) {
          data.items.push({
            podcast: {
              label: podcast.attributes.title,
              title: podcast.attributes.title,
              url,
              imageUrl: utils.createImageUrl(podcast.attributes.image)
            }
          });
        }
      });

      return data;
    })
    .catch(e => {
      queryService.logCatch(e, ref);
      return data;
    });
};
