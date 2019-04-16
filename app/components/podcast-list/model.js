'use strict';

const radioApiService = require('../../services/server/radioApi'),
  utils = require('../../services/universal/podcast'),
  maxItems = 4,
  /**
   * determines if the array of podcast items contains a url
   * @param {object} arr
   * @param {string} url
   * @returns {boolean}
   */
  containsUrl = (arr, url) => arr.some(item => item.podcast.url === url),
  /**
   * get podcast category ID
   * @param {string} categoryName
   * @returns {number}
   */
  getPodcastCategoryID = async (categoryName) => {
    const podcastCategories = await radioApiService.get('categories', { page: { size: 20 } }),
      [ podcastCategory ] = podcastCategories.data.filter(category => {
        return category.attributes.slug.includes(categoryName);
      });

    return podcastCategory.id;
  };

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = async function (ref, data, locals) {
  if (data.items.length === maxItems || !locals || locals.edit) {
    return new Promise((resolve) => resolve(data));
  }

  let podcastsFilter = { sort: 'popularity', page: { size: maxItems } };

  if (locals.sectionFront) {
    const podcastCategoryID = await getPodcastCategoryID(locals.sectionFront);

    if (podcastCategoryID) {
      podcastsFilter = {...podcastsFilter, filter: { category_id: podcastCategoryID } };
    }
  }

  try {
    const podcasts = await radioApiService.get('podcasts', podcastsFilter);

    if (podcasts) {
      podcasts.data.splice(0, maxItems).forEach((podcast) => {
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
    } else {
      return data;
    }
  } catch (e) {
    console.log(e);
    return data;
  }
};
