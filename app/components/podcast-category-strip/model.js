'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  radioApiService = require('../../services/server/radioApi'),
  utils = require('../../services/universal/podcast'),
  _get = require('lodash/get'),
  _uniqBy = require('lodash/uniqBy'),
  _slice = require('lodash/slice');

async function populatePodcasts(data, locals) {
  if (data.category) {
    return radioApiService.get(
      'podcasts',
      {
        sort: '-popularity',
        filter: { category_id: data.category.id },
        page: { size: 7 }
      },
      null, {}, locals
    ).then(response => {
      const backfillPodcasts = (response.data || []).map(podcast => {
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
        seeAllLink: `/podcasts/collection/${ _get(data.category, 'slug') }`
      };
      return data;
    }).catch(e => {
      console.error('error getting podcast data from api', e);
      return data;
    });
  }
  return data;
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
  render: async (uri, data, locals) => {
    return populatePodcasts(data, locals);
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
  save: async (uri, data) => {
    return data;
  }
});
