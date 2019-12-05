'use strict';

const { getComponentName } = require('clayutils'),
  { hasBadSource } = require('../../universal/valid-source');

module.exports = {
  label: 'Valid Source Error',
  description: 'The embed contains a script source that is not permitted.',
  type: 'error',
  async validate({ components }) {
    // grab the html-embeds on the page
    const htmlEmbeds = Object.entries(components)
      .filter(([uri]) => getComponentName(uri) === 'html-embed');

    return (await Promise.all(
      htmlEmbeds.map(async ([uri, data]) => {
        if (await hasBadSource(data.text, window.kiln.locals)) {
          return {
            uri,
            location: 'Html Embed » HTML',
            field: 'text',
            preview: data.text.substring(0, 85)
          };
        }
      }))
    )
      .filter(item => item);
  }
};
