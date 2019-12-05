'use strict';

// https://developer.apple.com/documentation/apple_news/component
// https://developer.apple.com/documentation/apple_news/apple_news_format/components
let primaryVideo = {
  URL: '',
  stillURL: ''
};
const log = require('../log').setup({ file: __filename }),
  sectionCategoryStyles = {
    music: 'category1Style',
    sports: 'category2Style',
    news: 'category3Style'
  },
  slugify = require('../slugify'),
  db = require('amphora-storage-postgres'),
  _isObject = require('lodash/isObject'),
  _get = require('lodash/get'),
  _upperFirst = require('lodash/upperFirst'),
  _flattenDeep = require('lodash/flattenDeep'),
  { getComponentInstance: getCompInstanceData } = require('../../server/publish-utils'),
  { getComponentName, getComponentInstance } = require('clayutils'),
  excludeEmptyComponents = require('./exclude-empty-components'),
  formatLocalDate = require('clayhandlebars/helpers/time/formatLocalDate'),
  APP_DOWNLOAD_URL = 'https://app.radio.com/apple-news-download',
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
   * @param {Object} locals
   * @param {Object} locals.site
   * @param {string} locals.site.protocol
   * @param {string} locals.site.host
   * @param {string} contentType
   * @returns {string}
  */
  getCanonicalURL = async (refInstance, { site: { protocol, host } }, contentType) => {
    // Get canonicalUrl from published content data if created in clay
    let { canonicalUrl } = await db.get(`${host}/_components/${ contentType }/instances/${refInstance}@published`);

    if (!canonicalUrl) {
      // Get customUrl from page data if content was imported
      const sql = `
          SELECT data->'customUrl'->>0 as uri
          FROM public.pages
          WHERE data->'main'->>0 ~ '${host}/_components/${ contentType }/instances/${refInstance}'
        `;

      canonicalUrl = await db.raw(sql).then(results => _get(results, 'rows[0].uri'));
    }

    return canonicalUrl || `${protocol}://${host}`;
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
    const formattedBylines = bylines.map((byline) => {
      const authorsListPrefix = byline.names.length
          ? _upperFirst(byline.prefix)
          : '',
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

      return [
        `${authorsListPrefix}${formattedAuthors}`,
        formattedSources
        // either credit sources might be missing, so this prevents an unecessary comma
      ].filter(content => content.trim().length > 0 )
        .join(', ');
    });

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
   * Get apple news format of each content ref
   *
   * @param {Array} content
   * @param {Boolean} [addAppDLLink]
   *
   * @returns {Promise|Array}
  */
  getContent = async (content) => {
    const contentANF = [];

    for (const contentInstance of content) {
      if (isNotHTMLEmbed(contentInstance._ref)) {
        await getCompInstanceData(`${ contentInstance._ref }.anf`)
          .then(data => {
            contentANF.push(data);
          })
          .catch(e => log('error', `Error getting component instance data for ${ contentInstance._ref } anf: ${e}`));
      }
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
      require('../anf-test-file-generator')(ref);
    }
  },
  anfPrimaryBodyContent = (anfComponents, sectionFront) => {
    const arrowIcon = `<span data-anf-textstyle="${sectionCategoryStyles[sectionFront]}">▸</span>`,
      linkText = '<span data-anf-textstyle="hyperlinkStyle">Get the RADIO.COM app now</span>',
      interstitialDownloadLink = {
        role: 'body',
        text: `<a href="${APP_DOWNLOAD_URL}">${linkText} ${arrowIcon}</a>`,
        format: 'html',
        layout: 'bodyItemLayout'
      };

    return {
      role: 'section',
      layout: 'bodyLayout',
      components: [
        ...anfComponents.slice(0, 1),
        interstitialDownloadLink,
        ...anfComponents.slice(1)
      ]
    };
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
        canonicalURL: await getCanonicalURL(refInstance, locals, contentType),
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
        ...contentType === 'gallery'
          ? [anfPrimaryBodyContent(await getContent(data.slides), data.sectionFront)]
          : [],
        contentType === 'article'
          ? anfPrimaryBodyContent(await getContent(data.content), data.sectionFront)
          : {
            role: 'section',
            layout: 'bodyLayout',
            components: await getContent(data.content)
          },
        require('./component-footer')
      ]
    };
  };

module.exports = {
  isNotHTMLEmbed: isNotHTMLEmbed,
  contentANF: async (...args) => excludeEmptyComponents(
    await getContentANF(...args)
  )
};
