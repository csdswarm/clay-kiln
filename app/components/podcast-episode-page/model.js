'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  { autoLink } = require('../breadcrumbs'),
  radioApiService = require('../../services/server/radioApi'),
  _get = require('lodash/get'),
  classnames = require('classnames');


async function addBreadcrumbs(data, locals) {
  const { podcast, episode } = locals;

  if (_get(podcast,'attributes') && _get(episode,'attributes')) {
    const { site_slug, title, station } = podcast.attributes,
      episode_site_slug = episode.attributes.site_slug,
      episode_title = episode.attributes.title,
      breadcrumbs = [
        { slug: data._computed.stationSlug, text: station.length ? station[0].name : null },
        { slug: 'podcasts', text: 'podcasts' },
        { slug: site_slug, text: title },
        { slug: episode_site_slug, text: episode_title }
      ];

    await autoLink(data, breadcrumbs, locals);
  }
}

async function getPodcastShow(locals) {
  const route = 'podcasts';

  return await radioApiService.get(route, {
    'filter[site_slug]':locals.params.dynamicSlug
  }, null, {}, locals);
}

async function getPodcastEpisode(locals) {
  const route = 'episodes';

  return await radioApiService.get(route, {
    'filter[episode_site_slug]':locals.params.dynamicEpisode
  }, null, {}, locals);
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
    const componentClass = classnames({
        editing: locals.edit
      }),
      [podcast, episode] = await Promise.all([getPodcastShow(locals), getPodcastEpisode(locals)]),
      podcastData = podcast.data[0],
      episodeData = episode.data[0];

    locals.podcast = podcast.data[0];
    locals.episode = episode.data[0];
    locals.contentType = 'episode';

    data._computed = {
      componentClass,
      stationSlug: _get(locals, 'params.stationSlug'),
      podcastDisplayData: JSON.stringify(podcastData, null , 4),// remove this line when completing the front-end ticket for podcast episode pages
      episodeDisplayData: JSON.stringify(episodeData, null, 4)// remove this line when completing the front-end ticket for podcast episode pages
    };
    await addBreadcrumbs(data, locals);
    return data;
  }
});
