'use strict';
const db = require('../../client/db'),
  _reduce = require('lodash/reduce'),
  helpers = require('./helpers'),
  locals = window.kiln.locals,
  slugs = {},
  fields = new Set([
    'stationSiteSlug'
  ]), // Add more fields to validate here
  components = new Set([
    'section-front'
  ]); // Add more components to validate here

/**
 * Get a list of valid site slugs and whether
 * or not they have a station front published
 *
 * @return {object}
 */
async function getSlugs() {
  if (Object.keys(slugs).length) {
    return slugs;
  }

  const publishedStations = await db.get(`${locals.site.host}/_lists/primary-section-fronts`, locals);

  locals.allStationsSlugs.forEach(slug => {
    slugs[slug] = publishedStations.some(({ value }) => slug === value);
  });

  return slugs;
}

module.exports = {
  label: 'Invalid Station Slug',
  description: 'The slug must be a valid station slug.',
  type: 'error',
  async validate(state, slugs) { // slugs passed for testing
    const validSlugs = slugs || await getSlugs();

    return _reduce(state.components, (errors, instance, uri) => {
      if (!components.has(helpers.getComponentName(uri))) {
        return errors;
      }

      Object.keys(instance).forEach(name => {
        if (!fields.has(name)) {
          return;
        }

        const val = instance[name];

        if (!val) {
          return;
        }

        // Check for value in validSlugs
        if (!validSlugs.hasOwnProperty(val)) {
          errors.push({
            uri: uri,
            field: 'stationSiteSlug',
            location: `${helpers.labelUtil(helpers.getComponentName(uri))} » Site Slug`,
            preview: `${val} is not a valid station slug`
          });
        } else if (validSlugs[val] === true) {
          // Station front is already published for this station
          errors.push({
            uri: uri,
            field: 'stationSiteSlug',
            location: `${helpers.labelUtil(helpers.getComponentName(uri))} » Site Slug`,
            preview: `A station page is already published for ${val}`
          });
        }
      });

      return errors;
    }, []);
  }
};
