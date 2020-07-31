'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  { autoLink } = require('../breadcrumbs'),
  _get = require('lodash/get'),
  _isEmpty = require('lodash/isEmpty'),
  classnames = require('classnames'),
  radioApiService = require('../../services/server/radioApi');


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

async function getPodcastEpisode(locals) {
  const route = `episodes?filter[episode_site_slug]=${ locals.params.dynamicEpisode }`,
    { data } = await radioApiService.get(route, {}, null, {}, locals);

  if (_isEmpty(data)) {
    return {};
  }

  return data[0];
}

async function getPodcastShow(locals) {
  const route = `podcasts?filter[site_slug]=${ locals.params.dynamicSlug }`,
    { data } = await radioApiService.get(route, {}, null, {}, locals);

  if (_isEmpty(data)) {
    return {};
  }
  return data[0];
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
    });

    if (!locals.episode || !locals.podcast) {
      const [ podcast, episode ] = await Promise.all([
        getPodcastShow(locals),
        getPodcastEpisode(locals)
      ]);

      // Setting data to be referenced on podcast lead
      locals.podcast = podcast;
      locals.episode = episode;
    }

    locals.contentType = 'episode';

    data._computed = {
      componentClass,
      stationSlug: _get(locals, 'params.stationSlug')
    };
    await addBreadcrumbs(data, locals);
    return data;
  }
});
