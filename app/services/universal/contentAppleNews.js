'use strict';

// https://developer.apple.com/documentation/apple_news/component
// https://developer.apple.com/documentation/apple_news/apple_news_format/components
let primaryVideo = {
  URL: '',
  stillURL: ''
};
const log = require('../../services/universal/log').setup({ file: __filename }),
  sectionCategoryStyles = {
    music: 'category1Style',
    sports: 'category2Style',
    news: 'category3Style'
  },
  slugify = require('../../services/universal/slugify'),
  _isObject = require('lodash/isObject'),
  _get = require('lodash/get'),
  _upperFirst = require('lodash/upperFirst'),
  _flattenDeep = require('lodash/flattenDeep'),
  { getComponentInstance: getCompInstanceData } = require('../../services/server/publish-utils'),
  { getComponentName, getComponentInstance } = require('clayutils'),
  formatLocalDate = require('clayhandlebars/helpers/time/formatLocalDate'),
  ISO_8601_FORMAT = 'YYYY-MM-DDTHH:mm:ss[Z]',
  RESPONSIVE_COLUMN_CONDITIONS = {
    IPHONE: {
      maxColumns: 4
    },
    IPAD: {
      minColumns: 5
    }
  },
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
  getCanonicalURL = async (refInstance, { sectionFront, secondarySectionFront, slug, contentType }, { site: { protocol, host } }) => {
    return getCompInstanceData(`${ host }/_pages/${ refInstance }`)
      .then(({ customUrl }) => {
        if (customUrl) return customUrl;
        else return `${ protocol }://${ host }/${ sectionFront }/${
          secondarySectionFront ? `${ secondarySectionFront }/` : '' }${
          contentType === 'gallery' ? 'gallery/' : '' }${ slug }`;
      })
      .catch(e => {
        log('error', `Error getting page data: ${ e }`);

        return `${ protocol }://${ host }/${ sectionFront }/${
          secondarySectionFront ? `${ secondarySectionFront }/` : '' }${
          contentType === 'gallery' ? 'gallery/' : '' }${ slug }`;
      });
  },
  /**
   * Format byline with author and sources
   *
   * @param {Array} bylines
   * @param {Object} data
   * @param {Object} locals
   * @returns {string}
  */
  formatBylines = (bylines, data, locals) => {
    const formattedBylines = bylines.reduce((newFormattedBylines, byline) => {
      const authorsListPrefix = byline.names.length ? _upperFirst(byline.prefix) : '',
        formattedAuthors = byline.names
          .map((name) => {
            const authorName = _isObject(name) ? name.text : name,
              authorSlug = slugify(authorName),
              { site: { protocol, prefix } } = locals,
              authorHref = `${protocol}://${prefix}/authors/${authorSlug}`,
              categoryStyle = sectionCategoryStyles[data.sectionFront];

            return `<a href="${authorHref}"><span data-anf-textstyle="${categoryStyle}">${authorName}</span></a>`;
          })
          .join(', '),
        formattedSources = byline.sources
          .map(source => `<span>${source.text}</span>`)
          .join(', ');

      newFormattedBylines.push(
        `${authorsListPrefix}${formattedAuthors}${formattedSources}`
      );
      return newFormattedBylines;
    }, []);

    return formattedBylines.join('<br />');
  },
  /**
   * Format timestamp from date published or last modified
   *
   * @param {Date} date
   * @param {Date} [dateModified]
   * @returns {string}
  */
  formatTimestamp = (date, dateModified) => {
    const formattedTimestamp = formatLocalDate(dateModified || date, 'MMM D, YYYY');

    return `<span data-anf-textstyle="publishTimeStyle">${formattedTimestamp}</span>`;
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
            return [{
              ...lede,
              layout: 'headerImageLayout'
            }];
          }

          const { components: [ledeImage, ledeCaption] } = lede;

          return [
            {
              ...ledeImage,
              layout: 'headerImageLayout'
            },
            ...ledeCaption
              ? [ledeCaption]
              : []
          ];
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
          .then(data => {
            const isTextComponent = 'text' in data,
              isEmptyTextComponent = isTextComponent && !data.text;

            if (isEmptyTextComponent) {
              return;
            }

            contentANF.push(data);
          })
          .catch(e => log('error', `Error getting component instance data for ${ contentInstance._ref } anf: ${e}`));
      }
    }

    if (addAppDLLink) {
      contentANF.splice(1, 0, appDownloadCTA());
    }

    return contentANF;
  },
  responsiveBylineComponents = (data, locals) => {
    const { byline, date, dateModified } = data,
      anfBylineComponent = (props) => ({
        role: 'byline',
        layout: 'authorLayout',
        textStyle: 'authorStyle',
        format: 'html',
        ...props
      }),
      bylineContent = formatBylines(byline, data, locals),
      timestampContent = formatTimestamp(date, dateModified);

    return [
      anfBylineComponent({
        text: `${bylineContent} ${timestampContent}`,
        conditional: {
          conditions: RESPONSIVE_COLUMN_CONDITIONS.IPHONE,
          hidden: true
        }
      }),
      anfBylineComponent({
        text: `${bylineContent}<br /><br />${timestampContent}`,
        conditional: {
          conditions: RESPONSIVE_COLUMN_CONDITIONS.IPAD,
          hidden: true
        }
      })
    ];
  },
  generateANFPreviewFile = (ref) => {
    const isDev = process.env.NODE_ENV === 'local';

    if (isDev) {
      require('./anf-test-file-generator')(ref);
    }
  },
  getContentANF = async function (ref, data, locals) {
    const tags = await getTags(data.tags),
      lede = await getLede(data.lead) || [],
      refInstance = getComponentInstance(ref),
      contentType = getComponentName(ref);

    generateANFPreviewFile(ref);

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
          role: 'header',
          style: 'headerStyle',
          layout: 'headerLayout',
          components: [
            {
              role: 'title',
              text: data.headline,
              layout: 'titleLayout',
              textStyle: 'titleStyle',
              format: 'html',
              conditional: [
                {
                  conditions: RESPONSIVE_COLUMN_CONDITIONS.IPHONE,
                  textStyle: {
                    fontSize: 35,
                    lineHeight: 42
                  }
                }
              ]
            },
            ...data.subHeadline ? [{
              role: 'intro',
              text: data.subHeadline,
              layout: 'introLayout',
              textStyle: 'introStyle',
              conditional: [
                {
                  conditions: RESPONSIVE_COLUMN_CONDITIONS.IPHONE,
                  textStyle: {
                    fontSize: 18,
                    lineHeight: 24
                  }
                }
              ]
            }] : [],
            ...responsiveBylineComponents(data, locals)
          ]
        },
        {
          role: 'section',
          layout: 'headerImageLayout',
          components: lede
        },
        ...contentType === 'gallery' ? [{
          role: 'section',
          layout: 'bodyLayout',
          components: await getContent(data.slides, true)
        }] : [],
        {
          role: 'section',
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
    };
  };

module.exports = {
  isNotHTMLEmbed: isNotHTMLEmbed,
  contentANF: getContentANF
};
