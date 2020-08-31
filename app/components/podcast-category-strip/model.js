'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  radioApiService = require('../../services/server/radioApi'),
  utils = require('../../services/universal/podcast'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  _get = require('lodash/get'),
  _uniqBy = require('lodash/uniqBy'),
  _slice = require('lodash/slice');

/**
 * Make http request for getting backfill podcasts
 *
 * @param {object} category
 * @param {object} locals
 * @returns {array}
 */
async function getBackfillPodcasts(category, locals) {
  const response = await radioApiService.get(
    'podcasts',
    {
      sort: '-popularity',
      filter: { category_id: category.id },
      page: { size: 7 }
    },
    null, {}, locals
  );

  return response.data;
}

/**
 * Get category podcasts lists, counting curated items and backfilling up to 7
 *
 * @param {object} data
 * @param {object} locals
 * @returns {promise | array}
 */
function populatePodcasts(data, locals) {
  if (data.category) {
    return __.getBackfillPodcasts(data.category, locals)
      .then(responseData => {
        const backfillPodcasts = (responseData || []).map(podcast => {
            return {
              id: podcast.id,
              // creates url for small podcast image
              imageUrl: utils.createImageUrl(_get(podcast, 'attributes.image')),
              title: _get(podcast, 'attributes.title'),
              url: `/podcasts/${ _get(podcast, 'attributes.site_slug') }`
            };
          }),
          // curated podcasts should be pinned to front of list
          curatedPodcasts = data.curatedPodcasts.map(podcast => podcast.podcast),
          totalPodcasts = curatedPodcasts.concat(backfillPodcasts),
          // filter out duplicates from backfill
          uniquePodcasts = _uniqBy(totalPodcasts, 'id'),
          // total deduped curated + backfill items should amount to exactly 7
          podcasts = _slice(uniquePodcasts, 0, 7);

        data._computed = {
          podcasts,
          seeAllLink: `/podcasts/collection/category/${ _get(data.category, 'slug') }`
        };
        return data;
      }).catch(e => {
        log('error', 'error getting podcast data from api', e);
        return data;
      });
  }
  return data;
}

// Exposing internal method for testing purposes
const __ = {
  getBackfillPodcasts
};

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
  render: (uri, data, locals) => {
    return populatePodcasts(data, locals);
  }
});

module.exports._internals = __;
