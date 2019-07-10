'use strict';

const _endsWith = require('lodash/endsWith'),
  cuid = require('cuid'),
  rest = require('../rest'),
  getComponentInstance = (uri, opts) => rest.get(`${process.env.CLAY_SITE_PROTOCOL}://${uri}`, opts),
  putComponentInstance = (uri, body) => rest.put(`${process.env.CLAY_SITE_PROTOCOL}://${uri}`, body, true);

/**
 * This function mutates and returns the passed in component instance data for a
 *   given component.  It ensures 'adTags' instances are created appropriately.
 *
 * @param {string} componentName - the component being upgraded
 * @param {string} uri - the instance uri being upgraded
 * @param {object} data - the instance data being upgraded
 * @returns {object} - the updated 'data' object
 */
module.exports = async (componentName, uri, data) => {
  const isNew = _endsWith(uri, `/_components/${componentName}/instances/new`),
    instanceId = isNew
      ? 'new'
      : cuid(),
    _ref = uri.replace(
      new RegExp(`/_components/${componentName}/.*`),
      `/_components/ad-tags/instances/${instanceId}`
    );

  if (!isNew) {
    const isPublished = _endsWith(uri, '@published'),
      newData = await getComponentInstance(_ref.replace(/\/instances\/.*/, '/instances/new'));

    await Promise.all([
      putComponentInstance(_ref, newData),
      isPublished ? putComponentInstance(_ref + '@published', newData) : null
    ]);
  }

  data.adTags = { _ref };

  return data;
};
