'use strict';

const rest = require('../../services/universal/rest'),
  canonicalProtocol = 'http', // todo: this is a HUGE assumption, make it not be an assumption?
  canonicalPort = process.env.PORT || 3001,
  /**
   * removes the first open and last close tags from a html string
   *
   * @param {string} html
   * @returns {string}
   */
  removeTag = (html) => html.replace(/^<[^>]+>(.*)<\/[^>]+>$/, '$1'),
  /**
   * adds/updates a component
   *
   * @param {string} uri
   * @param {object} body
   * @returns {Promise}
   */
  putComponent = (uri, body) => rest.put(uri.replace(/([^/]+)(.*)/, `${canonicalProtocol}://$1:${canonicalPort}$2`), body, true);

module.exports['1.0'] = async (uri, data) => {
  if (!data.description) {
    return {
      ...data,
      description: []
    };
  }

  const paragraphUriPublished = uri.replace('gallery-slide', 'paragraph'),
    paragraphUri = paragraphUriPublished.replace('@published', ''),
    paragraphData = { text: removeTag(data.description), type: 'Description', componentVariation: 'paragraph' };

  await Promise.all([
    putComponent(paragraphUri, paragraphData),
    putComponent(paragraphUriPublished, paragraphData)
  ]);

  return {
    ...data,
    description: [{ _ref : paragraphUriPublished }]
  };
};
