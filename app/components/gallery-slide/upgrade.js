'use strict';

const rest = require('../../services/universal/rest'),
  putComponentInstance = (uri, body) => rest.put(`${process.env.CLAY_SITE_PROTOCOL}://${uri}`, body, true),
  /**
   * removes the first open and last close tags from a html string
   *
   * @param {string} html
   * @returns {string}
   */
  removeTag = (html) => html.replace(/^<[^>]+>(.*)<\/[^>]+>$/, '$1');

module.exports['1.0'] = async (uri, data) => {
  if (typeof data.description !== 'string' || !data.description) {
    return {
      ...data,
      description: data.description ? data.description : []
    };
  }

  const descriptionUriPublished = uri.replace('gallery-slide', 'description'),
    descriptionUri = descriptionUriPublished.replace('@published', ''),
    descriptionData = { text: removeTag(data.description) };

  await Promise.all([
    putComponentInstance(descriptionUri, descriptionData),
    putComponentInstance(descriptionUriPublished, descriptionData)
  ]);

  return {
    ...data,
    description: [{ _ref : descriptionUriPublished }]
  };
};
