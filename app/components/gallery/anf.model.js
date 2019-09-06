'use strict';

// https://developer.apple.com/documentation/apple_news/component
// https://developer.apple.com/documentation/apple_news/apple_news_format/components

const log = require('../../services/universal/log').setup({ file: __filename }),
  { getComponentInstance: getCompInstanceData } = require('../../services/server/publish-utils'),
  { getComponentName, getComponentInstance } = require('clayutils'),
  { byline: formatAuthors } = require('../../services/universal/byline'),
  formatBylines = bylines => {
    let bylineHTML = '';

    bylines.forEach(byline => {
      if (byline.names.length) {
        const prefix = byline.prefix.charAt(0).toUpperCase() + byline.prefix.slice(1);

        bylineHTML = bylineHTML.concat(`${ prefix } `);
        bylineHTML = bylineHTML.concat(formatAuthors(byline.names));
        byline.sources.forEach(source => {
          bylineHTML = bylineHTML.concat(`, ${ source.text }`);
        });
      } else {
        const sources = byline.sources.map(source => source.text);

        bylineHTML = bylineHTML.concat(sources.join(', '));
      }
    });

    return bylineHTML;
  },
  /**
   * https://developer.apple.com/documentation/apple_news/apple_news_format/components/using_html_with_apple_news_format?language=data
   * iframe not supported in ANF
   *
   * @param {string} instance
   * @returns {Boolean}
  */
  isNotHTMLEmbed = instance => {
    return getComponentName(instance) !== 'html-embed';
  },
  /**
   * Get apple news format of lede ref
   *
   * @param {Array} lede
   * @returns {Promise|Array}
  */
  getLede = async lede => {
    const ledeANF = [];

    if (isNotHTMLEmbed(lede[0]._ref)) {
      try {
        ledeANF.push(await getCompInstanceData(`${ lede[0]._ref }.anf`));
      } catch (e) {
        log('error', `Error getting component instance data for lede anf: ${e}`);
      };
    }

    return ledeANF;
  },
  /**
   * Get apple news format of each content ref
   *
   * @param {Array} content
   * @returns {Promise|Array}
  */
  getContent = async content => {
    const contentANF = [];

    for (const contentInstance of content) {
      if (isNotHTMLEmbed(contentInstance._ref)) {
        try {
          contentANF.push(await getCompInstanceData(`${ contentInstance._ref }.anf`));
        } catch (e) {
          log('error', `Error getting component instance data
          for ${ contentInstance._ref } anf: ${e}`);
        };
      }
    }

    return contentANF;
  };

module.exports = async function (ref, data) {
  return {
    role: 'container',
    identifier: getComponentInstance(ref),
    components: [
      {
        role: 'header',
        style: 'headerStyle',
        layout: 'headerLayout',
        components: [
          {
            role: 'title',
            text: data.primaryHeadline,
            layout: 'headlineLayout',
            style: 'headlineStyle',
            textStyle: 'headlineTextStyle',
            format: 'html'
          },
          {
            role: 'byline',
            text: formatBylines(data.byline),
            layout: 'bylineLayout',
            style: 'bylineStyle',
            textStyle: 'bylineTextStyle',
            format: 'html'
          }
        ]
      },
      {
        role: 'section',
        style: 'ledeStyle',
        layout: 'ledeLayout',
        components: await getLede(data.lead)
      },
      {
        role: 'section',
        style: 'galleryStyle',
        layout: 'galleryLayout',
        components: await getContent(data.slides)
      },
      {
        role: 'section',
        style: 'bodyStyle',
        layout: 'bodyLayout',
        components: await getContent(data.content)
      }
    ]
  };
};
