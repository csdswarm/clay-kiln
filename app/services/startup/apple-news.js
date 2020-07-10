'use strict';

const _get = require('lodash/get'),
  HMAC_SHA256 = require('crypto-js/hmac-sha256'),
  ENCODE_BASE64 = require('crypto-js/enc-base64'),
  qs = require('querystring'),
  rest = require('../universal/rest'),
  log = require('../universal/log').setup({ file: __filename }),
  { getComponentInstance: getCompInstanceData } = require('../server/publish-utils'),
  ANF_API = 'https://news-api.apple.com/',
  ANF_CHANNEL_API = `${ ANF_API }channels/${ process.env.APPLE_NEWS_CHANNEL_ID }/`,
  moment = require('moment'),
  FormData = require('form-data'),
  /**
   * Handle request errors
   *
   * @param {Object} e
   * @param {string} message
   * @param {Object} data
   * @param {Object} res
   * @returns {Promise}
  */
  handleReqErr = (e, message, data, res = false) => {
    // This can be called from something other than a catch
    if (_get(e, 'stack')) {
      data = { stack: e.stack, ...data };
    }

    log('error', `APPLE NEWS LOG -- ${ message }`, data );

    if (res) {
      res.status(500).send(e);
    } else {
      return null;
    }
  },
  /**
   * Bootstrap API:
   * Set sections info and font paths
   *
   * @param {Object} req
   * @param {Object} res
   * @param {Function} next
   * @returns {Promise|Function}
  */
  bootstrap = async (req, res, next) => {
    if (!res.locals.appleNewsSections) {
      const allSections = await getAllSections();

      res.locals.appleNewsSections = {};
      allSections.forEach(section => {
        const { name, id, isDefault, links: { self } } = section;

        res.locals.appleNewsSections[ name ] = {
          id,
          isDefault,
          link: self
        };
      });
    }
    next();
  },
  /**
   * Map article sectionFront to apple news section
   *
   * @param {string} sectionFront
   * @param {Object} sections
   * @returns {Object}
  */
  sectionFrontToAppleNewsSectionMap = (sectionFront, sections) => {
    let section;

    switch (sectionFront) {
      case 'music':
        section = sections['Entertainment & Music'] || {};
        break;
      case 'sports':
        section = sections['Sports'] || {};
        break;
      case 'news':
        section = sections['News'] || {};
        break;
      default:
        section = {};
        break;
    }

    return section;
  },
  /**
   * Create header for request including auth
   *  API AUTHENTICATION: SHA-256 to combine the secret and the content of the message
   *  to generate a cryptographic hash
   *  API AUTHORIZATION: key is tied to channel, no roles
   *  API CONFIDENTIALITY: requests over HTTPS
   *
   * @param {String} method
   * @param {String} URL
   * @param {String} [contentType]
   * @param {String} [post]
   * @returns {Object}
  */
  createRequestHeader = (method, URL, contentType = '', post = '') => {
    // https://developer.apple.com/documentation/apple_news/apple_news_api/about_the_news_security_model#2970281

    const date = moment().format('YYYY-MM-DDTHH:mm:ss[Z]'), // ISO 8601
      canonicalRequest = method + URL + date + contentType + post,
      keyBytes = ENCODE_BASE64.parse(process.env.APPLE_NEWS_KEY_SECRET.toString(ENCODE_BASE64)),
      hashed = HMAC_SHA256(canonicalRequest, keyBytes),
      signature = ENCODE_BASE64.stringify(hashed);

    return {
      Authorization: `HHMAC; key=${ process.env.APPLE_NEWS_KEY_ID }; signature=${ signature }; date=${ date }`
    };
  },
  /**
   * Get all apple news sections in channel
   *
   * @param {Object} [req]
   * @param {Object} [res]
   * @returns {Promise|Array}
   */
  getAllSections = async (req, res) => {
    const method = 'GET',
      requestURL = `${ ANF_CHANNEL_API }sections`;

    return rest.request(requestURL, {
      method,
      headers: createRequestHeader(method, requestURL)
    }).then(({ status, statusText, body: sections }) => {
      if (status === 200) {
        if (res) res.send(sections.data || []);
        else return sections.data || [];
      } else {
        if (res) res.status(status).send(statusText);
        else return [];
      }
    }).catch(e => handleReqErr(e, 'Error getting all apple news sections', { requestURL }, res));
  },
  /**
   * Get data about section
   *
   * @param {Object} req
   * @param {String} req.params.sectionID - section ID
   * @param {Object} res
   * @returns {Promise|Object}
   */
  readSection = async (req, res) => {
    const method = 'GET',
      requestURL = `${ ANF_API }sections/${ req.params.sectionID }`;

    rest.request(requestURL, {
      method,
      headers: createRequestHeader(method, requestURL)
    }).then(({ status, statusText, body: section }) => {
      if (status === 200) res.send(section.data);
      else res.status(status).send(statusText);
    }).catch(e => handleReqErr(e, 'Error getting data for apple news section ID', { requestURL }, res));
  },
  /**
   * Search for articles in section
   * Possible query params:
   * fromDate {string}
   * pageSize {integer}
   * pageToken {string}
   * sortDir {string}
   * toDate {string}
   *
   * @param {Object} req
   * @param {String} req.params.sectionID - section ID
   * @param {Object} req.query - query params for search
   * @param {Object} res
   * @returns {Promise|Array}
   */
  searchArticlesInSection = async (req, res) => {
    const queryParams = qs.stringify(req.query),
      method = 'GET',
      requestURL = `${ ANF_API }sections/${ req.params.sectionID }/articles?${ queryParams }`;

    rest.request(requestURL, {
      method,
      headers: createRequestHeader(method, requestURL)
    }).then(({ status, statusText, body: articleResults }) => {
      if (status === 200) res.send(articleResults.data);
      else res.status(status).send(statusText);
    }).catch(e => handleReqErr(e, 'Error getting articles in section ID search', { requestURL }, res));
  },
  /**
   * Set promoted articles in section
   *
   * @param {Object} req
   * @param {String} req.params.sectionID - section ID
   * @param {Array} req.body.articleIDs - List of article IDs
   * @param {Object} res
   * @returns {Promise|Array}
   */
  promoteArticlesInSection = async (req, res) => {
    const method = 'POST',
      requestURL = `${ ANF_API }sections/${ req.params.sectionID }/promotedArticles`;

    rest.request(requestURL, {
      method,
      body: JSON.stringify({
        data: {
          promotedArticles: req.body.articleIDs
        }
      }),
      headers: createRequestHeader(method, requestURL)
    }).then(({ status, statusText, body }) => {
      if (status === 200) res.send(body.data.promotedArticles);
      else res.status(status).send(statusText);
    }).catch(e => handleReqErr(e, 'Error setting promoted articles in section ID', { requestURL }, res));
  },
  /**
   * Search for articles in channel
   * Possible query params:
   * fromDate {string}
   * pageSize {integer}
   * pageToken {string}
   * sortDir {string}
   * toDate {string}
   *
   * @param {Object} req
   * @param {Object} req.query - query params for search
   * @param {Object} res
   * @returns {Promise|Array}
   */
  searchArticlesInChannel = async (req, res) => {
    const method = 'GET',
      requestURL = `${ ANF_CHANNEL_API }articles`;

    rest.request(requestURL, {
      method,
      headers: createRequestHeader(method, requestURL)
    }).then(({ status, statusText, body: searchResults }) => {
      if (status === 200) res.send(searchResults.data);
      else res.status(status).send(statusText);
    }).catch(e => handleReqErr(e, 'Error getting apple news search results for articles in channel', { requestURL }, res));
  },
  /**
   * Get article data
   *
   * @param {Object} [req]
   * @param {String} req.params.articleID - article ID
   * @param {Object} [res]
   * @returns {Promise|Object}
   */
  readArticle = async (req, res) => {
    const method = 'GET',
      requestURL = `${ ANF_API }articles/${ req.params.articleID }`;

    return rest.request(requestURL, {
      method,
      headers: createRequestHeader(method, requestURL)
    }).then(({ status, statusText, body: article }) => {
      if (status === 200) {
        if (res) res.send(article.data);
        else return article.data;
      } else {
        if (res) res.status(status).send(statusText);
        else return statusText;
      }
    }).catch(e => handleReqErr(e, 'Error getting article data from apple news API', { requestURL }, res));
  },
  /**
   * Publish/update article to apple news by sending
   * apple news formatted json of article,
   * font files to be ref'd in document textStyles,
   * and article metadata
   *
   * @param {Object} req
   * @param {String} [req.params.articleID] - article ID
   * @param {Object} req.body
   * @param {string} req.body.articleRef - article instance URL
   * @param {Object} res
   * @returns {Promise|Object}
  */
  articleRequest = async (req, res) => {
    // https://developer.apple.com/documentation/apple_news/create_an_article
    // https://developer.apple.com/documentation/apple_news/update_an_article
    const updateArticle = !!req.params.articleID,
      method = 'POST',
      requestURL = `${ updateArticle ? ANF_API : ANF_CHANNEL_API }articles${ updateArticle ? `/${ req.params.articleID }` : '' }`,
      { articleRef, revision } = req.body;

    try {
      const [ { sectionFront,
          secondarySectionFront,
          accessoryText,
          isCandidateToBeFeatured,
          isHidden,
          isSponsored,
          tags: { _ref: tagsRef },
          noIndexNoFollow
        },
        articleANF ] = await Promise.all([
          getCompInstanceData(articleRef),
          getCompInstanceData(`${ articleRef }.anf?config=true`)
        ]),
        { link: sectionLink } = sectionFrontToAppleNewsSectionMap(sectionFront, res.locals.appleNewsSections),
        formData = new FormData,
        metadata = {
          // See https://developer.apple.com/documentation/apple_news/create_article_metadata_fields for details
          data: {
            ...updateArticle ? { revision } : {},
            accessoryText: accessoryText || secondarySectionFront || sectionFront || 'metadata.byline',
            ...isCandidateToBeFeatured ? { isCandidateToBeFeatured } : {},
            ...isHidden ? { isHidden } : {},
            ...process.env.APPLE_NEWS_PREVIEW_ONLY ? { isPreview: true } : {},
            ...isSponsored ? { isSponsored } : {},
            links: {
              channel: ANF_CHANNEL_API,
              sections: sectionLink ? [ sectionLink ] : []
            }
          }
        },
        validAppleNews = async () => {
          const { items: tagsItems } = await getCompInstanceData(tagsRef);

          return sectionLink
            && !tagsItems.some(tag => tag.text === 'RADIO.COM Latino')
            && !noIndexNoFollow;
        };

      if (await validAppleNews()) {
        formData.append('metadata', JSON.stringify(metadata), 'metadata.json');
        formData.append('article.json', JSON.stringify(articleANF), 'article.json');

        const contentType = `multipart/form-data; boundary=${ formData._boundary }`;

        rest.request(requestURL, {
          method,
          headers: {
            ...createRequestHeader(method, requestURL, contentType,
              formData.getBuffer().toString()),
            'Content-Type': contentType
          },
          body: formData
        }).then(({ status, statusText, body }) => {
          if ([ 200, 201 ].includes(status)) {
            // To be deleted/changed to info once ANF beings working
            handleReqErr(
              {},
              'Article Post Content Success', {
                status,
                statusText,
                uri: articleRef,
                data: {
                  createdAt: body.createdAt,
                  modifiedAt: body.modifiedAt,
                  id: body.id,
                  type: body.type,
                  shareUrl: body.shareUrl,
                  links: body.links,
                  revision: body.revision
                }
              },
              requestURL);
            res.status(status).send(body.data);
          } else {
            handleReqErr(
              {},
              'Article Post Error',
              {
                status,
                statusText,
                errors: body.errors,
                metadata: JSON.stringify(metadata),
                uri: articleRef,
                articleANF: JSON.stringify(articleANF)
              });
            res.status(status).send(body);
          }
        }).catch(e => handleReqErr(
          e,
          'Error publishing/updating article to apple news API',
          {
            requestURL,
            article: articleRef,
            metadata: JSON.stringify(metadata),
            uri: articleRef,
            articleANF: JSON.stringify(articleANF)
          },
          res
        ));
      } else {
        res.status(200).send('Article not posted to apple news feed');
      }
    } catch (e) {
      handleReqErr(e,'Generic Error',{
        requestURL
      }, res);
    }
  },
  /**
   * Publish article to apple news channel
   *
   * @param {Object} req
   * @param {Object} res
   * @returns {Promise|Object}
   */
  publishArticle = async (req, res) => {
    await articleRequest(req, res);
  },
  /**
   * Update existing article in apple news channel
   *
   * @param {Object} req
   * @param {Object} res
   * @returns {Promise|Object}
   */
  updateArticle = async (req, res) => {
    await articleRequest(req, res);
  },
  /**
   * Delete article in apple news channel
   *
   * @param {Object} req
   * @param {String} req.params.articleID - article ID
   * @param {Object} res
   * @returns {Promise}
   */
  deleteArticle = async (req, res) => {
    const method = 'DELETE',
      requestURL = `${ ANF_API }articles/${ req.params.articleID }`;

    rest.request(requestURL, {
      method,
      headers: createRequestHeader(method, requestURL)
    }).then(({ status, statusText }) => {
      res.status(status).send(statusText);
    }).catch(e => handleReqErr(e, 'Error deleting article with apple news API', { requestURL }, res));
  },
  /**
   * Add apple news routes to the express app
   *
   * @param {Object} app the express app
   */
  inject = (app) => {

    app.use('/apple-news*', bootstrap);

    app.get('/apple-news/sections', getAllSections);
    app.get('/apple-news/sections/:sectionID', readSection);
    app.get('/apple-news/sections/:sectionID/articles', searchArticlesInSection);
    app.post('/apple-news/sections/:sectionID/promote', promoteArticlesInSection);

    app.get('/apple-news/articles', searchArticlesInChannel);
    app.get('/apple-news/articles/:articleID', readArticle);
    app.post('/apple-news/articles', publishArticle);
    app.post('/apple-news/articles/:articleID', updateArticle);
    app.delete('/apple-news/articles/:articleID', deleteArticle);
  };

module.exports.inject = inject;
