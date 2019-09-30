'use strict';

// https://developer.apple.com/documentation/apple_news/component
// https://developer.apple.com/documentation/apple_news/apple_news_format/components
let primaryVideo = {
  URL: '',
  stillURL: ''
};
const log = require('../../services/universal/log').setup({ file: __filename }),
  _get = require('lodash/get'),
  _upperFirst = require('lodash/upperFirst'),
  _flattenDeep = require('lodash/flattenDeep'),
  { getComponentInstance: getCompInstanceData } = require('../../services/server/publish-utils'),
  { getComponentName, getComponentInstance } = require('clayutils'),
  { byline: formatAuthors } = require('../../services/universal/byline'),
  formatLocalDate = require('clayhandlebars/helpers/time/formatLocalDate'),
  ISO_8601_FORMAT = 'YYYY-MM-DDTHH:mm:ss[Z]',
  /**
   * Get canonical URL from customUrl or derived from section fronts and slug
   *
   * @param {string} refInstance
   * @param {Object} data
   * @param {string} data.sectionFront
   * @param {string} data.secondarySectionFront
   * @param {string} data.slug
   * @param {Object} locals
   * @param {Object} locals.site
   * @param {string} locals.site.protocol
   * @param {string} locals.site.host
   * @returns {string}
  */
  getCanonicalURL = async (refInstance, { sectionFront, secondarySectionFront, slug }, { site: { protocol, host } }) => {
    return getCompInstanceData(`${ host }/_pages/${ refInstance }`)
      .then(({ customUrl }) => {
        if (customUrl) return customUrl;
        else return `${ protocol }://${ host }/${ sectionFront }/${ secondarySectionFront ?
          `${ secondarySectionFront }/` : '' }${ slug }`;
      })
      .catch(e => {
        log('error', `Error getting page data: ${ e }`);

        return `${ protocol }://${ host }/${ sectionFront }/${ secondarySectionFront ?
          `${ secondarySectionFront }/` : '' }${ slug }`;
      });
  },
  /**
   * Format byline with author and sources
   *
   * @param {Array} bylines
   * @returns {string}
  */
  formatBylines = bylines => {
    let bylineHTML = '';

    bylines.forEach(byline => {
      if (byline.names.length) {
        const prefix = _upperFirst(byline.prefix);

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
   * Format timestamp from date published or last modified
   *
   * @param {Date} date
   * @param {Date} [dateModified]
   * @returns {string}
  */
  formatTimestamp = (date, dateModified) => {
    let formattedTimestamp = '';

    if (dateModified) {
      formattedTimestamp = 'Updated on ';
    }

    formattedTimestamp = formattedTimestamp.concat(
      formatLocalDate(dateModified || date || new Date(), 'MMMM D, YYYY'),
      formatLocalDate(dateModified || date || new Date(), ' h:mm a')
    );

    return formattedTimestamp;
  },
  /**
   * Get tags from tags component ref
   *
   * @param {Object} tags
   * @returns {Promise|string}
  */
  getTags = async tags => {
    return getCompInstanceData(tags._ref).then(tags => {
      return tags.items.map(tag => tag.text);
    }).catch(e => log('error', `Error getting tags: ${e}`));
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
    if (isNotHTMLEmbed(lede[0]._ref)) {
      return getCompInstanceData(`${ lede[0]._ref }.anf`)
        .then(lede => {
          if (lede.role === 'video') {
            const { URL, stillURL } = lede;

            primaryVideo = { URL, stillURL };
          }

          return [ lede ];
        }).catch(e => log('error', `Error getting lede anf: ${ e }`));
    }
  },
  /**
   * Build app download CTA link in ANF
   *
   * @returns {Object}
  */
  appDownloadCTA = () => {
    return {
      role: 'aside',
      style: 'asideStyle',
      layout: 'asideLayout',
      components: [
        {
          role: 'body',
          text: 'Download the RADIO.COM app now',
          style: 'appDownloadCTALinkStyle',
          layout: 'appDownloadCTALinkLayout',
          textStyle: 'appDownloadCTALinkTextStyle',
          additions: [
            {
              type: 'link',
              URL: 'https://app.radio.com/apple-news-download'
            }
          ]
        },
        {
          role: 'image',
          URL: 'bundle://arrow.png',
          style: 'appDownloadCTAArrowStyle',
          layout: 'appDownloadCTAArrowLayout'
        }
      ]
    };
  },
  /**
   * Get apple news format of each content ref
   *
   * @param {Array} content
   * @param {Boolean} [addAppDLLink]
   *
   * @returns {Promise|Array}
  */
  getContent = async (content, addAppDLLink = false) => {
    const contentANF = [];

    for (const contentInstance of content) {
      if (isNotHTMLEmbed(contentInstance._ref)) {
        await getCompInstanceData(`${ contentInstance._ref }.anf`)
          .then(data => contentANF.push(data))
          .catch(e => log('error', `Error getting component instance data for ${ contentInstance._ref } anf: ${e}`));
      }
    }

    if (addAppDLLink) {
      contentANF.splice(1, 0, appDownloadCTA());
    }

    return contentANF;
  },
  getContentANF = async function (ref, data, locals) {
    const tags = await getTags(data.tags),
      lede = await getLede(data.lead) || [],
      refInstance = getComponentInstance(ref),
      contentType = getComponentName(ref);

    return {
      identifier: refInstance,
      title: data.primaryHeadline,
      metadata: {
        authors: data.byline.length ? _flattenDeep(data.byline.map(byline => _get(byline, 'names')))
          .map(name => _get(name, 'text'))
          : [],
        canonicalURL: await getCanonicalURL(refInstance, data, locals),
        dateCreated: formatLocalDate(data.date || data.dateModified || new Date(), ISO_8601_FORMAT),
        dateModified: formatLocalDate(data.dateModified || data.date || new Date(), ISO_8601_FORMAT),
        datePublished: formatLocalDate(data.date || data.dateModified || new Date(), ISO_8601_FORMAT),
        excerpt: data.pageDescription,
        ...tags ? { keywords: tags } : {},
        thumbnailURL: primaryVideo.stillURL || data.feedImgUrl,
        ...!!primaryVideo.URL ? { videoURL: primaryVideo.URL } : {}
      },
      components: [
        {
          role: 'container',
          style: contentType === 'article' ? 'articleStyle' : 'galleryStyle',
          layout: contentType === 'article' ? 'articleLayout' : 'galleryLayout',
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
                  text: `${ formatBylines(data.byline) } ${ formatTimestamp(data.date, data.dateModified) }`,
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
              components: lede
            },
            ...contentType === 'gallery' ? [{
              role: 'section',
              style: 'galleryStyle',
              layout: 'galleryLayout',
              components: await getContent(data.slides, true)
            }] : [],
            {
              role: 'section',
              style: 'bodyStyle',
              layout: 'bodyLayout',
              components: await getContent(data.content, contentType === 'article')
            },
            {
              role: 'section',
              style: 'footerStyle',
              layout: 'footerLayout',
              components: [
                {
                  role: 'logo',
                  URL: 'bundle://radiocom-logo-white.png',
                  layout: 'logoLayout',
                  style: 'logoStyle'
                },
                {
                  role: 'body',
                  text: 'Get the latest news and alerts delivered right to your inbox',
                  layout: 'footerBodyLayout',
                  style: 'footerBodyStyle',
                  textStyle: 'footerBodyTextStyle'
                },
                {
                  role: 'container',
                  style: 'footerCTABtnContainerStyle',
                  layout: 'footerCTABtnContainerLayout',
                  components: [
                    {
                      role: 'image',
                      URL: 'bundle://mail.png',
                      style: 'footerCTABtnMailStyle',
                      layout: 'footerCTABtnMailLayout'
                    },
                    {
                      role: 'body',
                      text: 'SIGN UP NOW',
                      layout: 'footerCTABtnLayout',
                      style: 'footerCTABtnStyle',
                      textStyle: 'footerCTABtnTextStyle',
                      additions: [
                        {
                          type: 'link',
                          URL: 'https://app.radio.com/apple-news-download'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
  };

module.exports = {
  isNotHTMLEmbed: isNotHTMLEmbed,
  contentANF: getContentANF
};
