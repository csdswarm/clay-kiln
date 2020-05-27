'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  { autoLink } = require('../breadcrumbs'),
  radioApiService = require('../../services/server/radioApi'),
  _get = require('lodash/get');


async function addBreadcrumbs(data, locals) {
  const { podcast, episode } = locals;

  if (podcast && podcast.attributes && episode && episode.attributes) {
    const { site_slug, title, station } = podcast.attributes,
      episode_site_slug = episode.attributes.site_slug,
      episode_title = episode.attributes.title,
      breadcrumbs = [
        { slug: data.stationSlug, text: station.length ? station[0].name : null },
        { slug: 'podcasts', text: 'podcasts' },
        { slug: site_slug, text: title },
        { slug: episode_site_slug, text: episode_title }
      ];

    await autoLink(data, breadcrumbs, locals);
  }
}

async function getPodcastShow(locals) {
  const route = `podcasts?filter[site_slug]=${locals.params.dynamicSlug}`;

  return await radioApiService.get(route, {}, null, {}, locals);
}

async function getPodcastEpisode(locals) {
  const route = `episodes?filter[episode_site_slug]=${locals.params.dynamicEpisode}`;

  return await radioApiService.get(route, {}, null, {}, locals);
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
    if (!locals || !locals.params) {
      return data;
    }
    let componentClass = ' ';

    if (locals.edit) {
      componentClass += 'editing ';
    }
    const podcast = await getPodcastShow(locals),
      episode = await getPodcastEpisode(locals);

    // Stored in data for breadcrumbs component
    data.stationSlug = _get(locals, 'params.stationSlug');
    locals.podcast = podcast.data[0];
    locals.episode = episode.data[0];
    locals.contentType = 'episode';

    await addBreadcrumbs(data, locals);
    data._computed = {
      componentClass
    };
    return data;
  }
});
