'use strict';

const _get = require('lodash/get'),
  backFillThreshold = 3,
  logger = require('../../services/universal/log'),
  log = logger.setup({ file: __filename }),
  maxItems = 4,
  podcastUtils = require('../../services/universal/podcast'),
  radioApiService = require('../../services/server/radioApi'),
  slugifyService = require('../../services/universal/slugify'),
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
      const podcast = _get(item, 'podcast');

      if (podcast) {
        podcast.imageUrl = podcast.imageUrl
          ? podcastUtils.createImageUrl(podcast.imageUrl)
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
        itemsToGetStationData = podcasts.slice(0,maxItems),
        stationsById = await podcastUtils.getStationsForPodcasts(itemsToGetStationData,locals),
        uniqueUrls = (podcast) => {
          const url = podcastUtils.createUrl(podcast,stationsById[podcastUtils.getStationIdForPodcast(podcast)]);

          return !containsUrl(data.items, url);
        },
        itemsToBackFill = podcasts
          .filter(uniqueUrls)
          .slice(0, numItemsToBackFill)
          .map((podcast) => {
            const url = podcastUtils.createUrl(podcast,stationsById[podcastUtils.getStationIdForPodcast(podcast)]);

            return {
              podcast: {
                label: podcast.attributes.title,
                title: podcast.attributes.title,
                url,
                imageUrl: podcastUtils.createImageUrl(podcast.attributes.image)
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
