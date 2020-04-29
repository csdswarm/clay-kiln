'use strict';

const { getComponentName } = require('clayutils'),
  getBadSources = require('../../universal/get-bad-sources'),
  uniq = require('lodash/uniq');

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
        const badSources = await getBadSources(data.text, window.kiln.locals);

        if (badSources.length) {
          return {
            uri,
            location: 'Html Embed » HTML',
            field: 'text',
            preview: uniq(badSources).join(' ')
          };
        }
      }))
    )
      .filter(item => item);
  }
};
