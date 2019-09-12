'use strict';

const { getComponentName } = require('clayutils'),
  { hasBadSource } = require('../../universal/html-embed');

module.exports = {
  label: 'Embed Script Error',
  description: 'This embed contains a script source that is not allowed.',
  type: 'error',
  async validate({ components }) {
    // grab the html-embeds on the page
    const htmlEmbeds = Object.entries(components)
      .filter(([uri]) => getComponentName(uri) === 'html-embed');

    return (await Promise.all(
      htmlEmbeds.map(async ([uri, data]) => {
        if (await hasBadSource(data.text)) {
          return {
            uri,
            location: 'Html Embed » HTML',
            field: 'text',
            preview: data.text
          };
        }
      }))
    )
      .filter(item => item);
  }
};
