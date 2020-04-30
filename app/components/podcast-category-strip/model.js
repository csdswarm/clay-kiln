'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  radioApiService = require('../../services/server/radioApi'),
  utils = require('../../services/universal/podcast'),
  logger = require('../../services/universal/log'),
  log = logger.setup({ file: __filename }),
  _get = require('lodash/get'),
  _uniqBy = require('lodash/uniqBy'),
  _slice = require('lodash/slice');

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
  render: async (uri, data, locals) => {
    try {
      const { data: podcasts } = await radioApiService.get(
        'podcasts',
        {
          sort: '-popularity',
          filter: { category_id: data.category.id },
          page: { size: 7 }
        },
        null, {}, locals
      );

      data.backfillPodcasts = podcasts;
    } catch (e) {
      log('error', 'Error backfilling podcasts: ', e);
      data.backfillPodcasts = [];
    }

    // curated podcasts should be pinned to front of list
    const totalPodcasts = data.curatedPodcasts.concat(data.backfillPodcasts),
      // filter out duplicates from backfill
      uniquePodcasts = _uniqBy(totalPodcasts, 'id'),
      // total deduped curated + backfill items should amount to exactly 7
      podcasts = _slice(uniquePodcasts, 0, 7);

    data._computed = {
      items: podcasts.map(podcast => {
        return {
          // creates url for small podcast image
          imageUrl: utils.createImageUrl(podcast.attributes.image),
          title: podcast.attributes.title,
          url: `/podcasts/${podcast.attributes.site_slug}`
        };
      }),
      seeAllLink: `/podcasts/collection/${ _get(data.category, 'attributes.slug') }`
    };

    return data;
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
  save: (uri, data, locals) => {
    // mock category data
    data.category = {
      id: 5,
      attributes: {
        name: 'Arts',
        slug: 'arts'
      }
    };

    return data;
  }
});
