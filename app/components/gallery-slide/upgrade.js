'use strict';

const { putComponent } = require('../../services/server/publish-utils'),
  /**
   * removes the first open and last close tags from a html string
   *
   * @param {string} html
   * @returns {string}
   */
  removeTag = (html) => html.replace(/^<[^>]+>(.*)<\/[^>]+>$/, '$1');

module.exports['1.0'] = async (uri, data) => {
  if (typeof data.description !== 'string') {
    return {
      ...data,
      description: data.description ? data.description : []
    };
  }

  const descriptionUriPublished = uri.replace('gallery-slide', 'description'),
    descriptionUri = descriptionUriPublished.replace('@published', ''),
    descriptionData = { text: removeTag(data.description) };

  await Promise.all([
    putComponent(descriptionUri, descriptionData),
    putComponent(descriptionUriPublished, descriptionData)
  ]);

  return {
    ...data,
    description: [{ _ref : descriptionUriPublished }]
  };
};
