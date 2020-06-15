'use strict';

const radioApiService = require('../../services/server/radioApi'),
  slugifyService = require('../../services/universal/slugify'),
  utils = require('../../services/universal/podcast'),
  logger = require('../../services/universal/log'),
  log = logger.setup({ file: __filename }),
  maxItems = 4,
  backFillThreshold = 3,
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
   * @param {object} locals
   * @returns {number}
   */
  getPodcastCategoryID = async (categoryName, locals) => {
    const podcastCategories = await radioApiService.get('categories', { page: { size: 20 } }, null, {}, locals),
      podcastCategory = podcastCategories.data.find(category => {
        return category.attributes.slug.includes(slugifyService(categoryName));
      });

    return podcastCategory ? podcastCategory.id : null;
  };

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = async function (ref, data, locals) {
  const { backFillEnabled } = data;

  if (data.items.length === maxItems || !locals || locals.edit || ref.includes('/instances/new')) {
    data.items.forEach(item => {
      if (item.podcast) {
        item.podcast.imageUrl = item.podcast.imageUrl
          ? utils.createImageUrl(item.podcast.imageUrl)
          : '';
      }
    });

    return data;
  }

  try {
    const curatedCount = data.items.length,
      shouldBackFill = backFillEnabled
        && curatedCount <= backFillThreshold;

    if (shouldBackFill) {
      let podcastsFilter = { sort: 'popularity', page: { size: maxItems } };

      if (locals.sectionFront || locals.secondarySectionFront) {
        const podcastCategoryID = await getPodcastCategoryID(locals.secondarySectionFront || locals.sectionFront, locals);

        if (podcastCategoryID) {
          podcastsFilter = { ...podcastsFilter, filter: { category_id: podcastCategoryID } };
        }
      }

      const { data: podcasts } = await radioApiService.get('podcasts', podcastsFilter, null, {}, locals),
        numItemsToBackFill = maxItems - curatedCount,
        uniqueUrls = (podcast) => {
          const url = utils.createUrl(podcast.attributes.site_slug);

          return !containsUrl(data.items, url);
        },
        itemsToBackFill = podcasts
          .filter(uniqueUrls)
          .slice(0, numItemsToBackFill)
          .map((podcast) => {
            const url = utils.createUrl(podcast.attributes.site_slug);

            return {
              podcast: {
                label: podcast.attributes.title,
                title: podcast.attributes.title,
                url,
                imageUrl: utils.createImageUrl(podcast.attributes.image)
              }
            };
          });

      data.items.push(
        ...itemsToBackFill
      );
    }
  } catch (e) {
    log('error', 'issue backfilling podcasts', e);
  }

  return data;
};
