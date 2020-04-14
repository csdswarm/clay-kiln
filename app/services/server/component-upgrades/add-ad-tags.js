'use strict';

const _endsWith = require('lodash/endsWith'),
  cuid = require('cuid'),
  { getComponentInstance, putComponentInstance } = require('../../server/publish-utils');

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
  const isNewOrDefault = _endsWith(uri, `/_components/${componentName}/instances/new`)
      || _endsWith(uri, `/_components/${componentName}`),
    adTagsInstanceId = isNewOrDefault
      ? 'new'
      : cuid(),
    adTagsUri = uri.replace(
      new RegExp(`/_components/${componentName}(/.*|$)`),
      `/_components/ad-tags/instances/${adTagsInstanceId}`
    );

  if (!isNewOrDefault) {
    const isPublished = _endsWith(uri, '@published'),
      newData = await getComponentInstance(adTagsUri.replace(/\/instances\/.*/, '/instances/new'));

    await Promise.all([
      putComponentInstance(adTagsUri, newData),
      isPublished ? putComponentInstance(adTagsUri + '@published', newData) : null
    ]);
  }

  data.adTags = { _ref: adTagsUri };

  return data;
};
