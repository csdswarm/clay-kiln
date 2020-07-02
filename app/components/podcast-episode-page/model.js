'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  { autoLink } = require('../breadcrumbs'),
  _get = require('lodash/get'),
  classnames = require('classnames');


async function addBreadcrumbs(data, locals) {
  const { podcast, episode } = locals;

  if (_get(podcast, 'attributes') && _get(episode, 'attributes')) {
    const { site_slug, title, station } = podcast.attributes,
      breadcrumbs = [
        { slug: data._computed.stationSlug, text: station.length ? station[0].name : null },
        { slug: 'podcasts', text: 'podcasts' },
        { slug: site_slug, text: title }
      ];

    await autoLink(data, breadcrumbs, locals);
  }
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

    // Setting data to be referenced on podcast episode lead
    locals.contentType = 'episode';

    data._computed = {
      componentClass,
      stationSlug: _get(locals, 'params.stationSlug')
    };
    await addBreadcrumbs(data, locals);
    return data;
  }
});
