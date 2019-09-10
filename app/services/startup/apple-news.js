'use strict';

const _get = require('lodash/get'),
  qs = require('querystring'),
  rest = require('../universal/rest'),
  log = require('../universal/log').setup({file: __filename}),
  ANF_API = 'https://news-api.apple.com/',
  ANF_API_WITH_CHANNEL = `https://news-api.apple.com/channels/${ process.env.APPLE_NEWS_CHANNEL_ID }/`,
  moment = require('moment'),
  /**
   * Create header for request including auth
   *
  */
  createRequestHeader = () => {
    // https://developer.apple.com/documentation/apple_news/apple_news_api/about_the_news_security_model#2970281
    // TODO
    const hash = '';

    return {
      Accept: 'application/json',
      Authorization: `HHMAC; key=${ process.env.APPLE_NEWS_KEY_ID }; signature=${ hash }; date=${ moment().format() }`
    };
  },
  /**
   * Get all apple news sections in channel
   *
   * @param {object} req
   * @param {object} res
   * @returns {Promise|Array}
   */
  getAllSections = async (req, res) => {
    try {
      const { status, statusText, body: sections } = await rest.request(`${ ANF_API_WITH_CHANNEL }sections`, {
        method: 'GET',
        headers: createRequestHeader()
      });

      if (status === 200) {
        res.send(sections.data);
      } else {
        res.status(status).send(statusText);
      }
    } catch (e) {
      log('error', `Error getting all apple news sections: ${ e }`);
      res.status(500).send(e);
    }
  },
  /**
   * Get data about section
   *
   * @param {object} req
   * @param {String} req.params.sectionID - section ID
   * @param {object} res
   * @returns {Promise|Object}
   */
  readSection = async (req, res) => {
    try {
      const { status, statusText, body: section } = await rest.request(`${ ANF_API }sections/${ req.params.sectionID }`, {
        method: 'GET',
        headers: createRequestHeader()
      });

      if (status === 200) {
        res.send(section.data);
      } else {
        res.status(status).send(statusText);
      }
    } catch (e) {
      log('error', `Error getting data for apple news section ID ${ req.params.sectionID }: ${ e }`);
      res.status(500).send(e);
    }
  },
  /**
   * Search for articles in section
   *
   * @param {object} req
   * @param {String} req.params.sectionID - section ID
   * @param {object} req.query - query params for search
   * @param {object} res
   * @returns {Promise|Array}
   */
  searchArticlesInSection = async (req, res) => {
    try {
      // query params: fromDate {string}, pageSize {integer}, pageToken {string}, sortDir {string}, toDate {string}

      const queryParams = qs.stringify(req.query),
        { status, statusText, body: articleResults } = await rest.request(`${ ANF_API }sections/${ req.params.sectionID }/articles?${ queryParams }`, {
          method: 'GET',
          headers: createRequestHeader()
        });

      if (status === 200) {
        res.send(articleResults.data);
      } else {
        res.status(status).send(statusText);
      }
    } catch (e) {
      log('error', `Error getting articles in section ID ${ req.params.sectionID } search: ${ e }`);
      res.status(500).send(e);
    }
  },
  /**
   * Set promoted articles in section
   *
   * @param {object} req
   * @param {String} req.params.sectionID - section ID
   * @param {Array} req.body.articleIDs - List of article IDs
   * @param {object} res
   * @returns {Promise|Array}
   */
  promoteArticlesInSection = async (req, res) => {
    try {
      const { status, statusText, body } = await rest.request(`${ ANF_API }sections/${ req.params.sectionID }/promotedArticles`, {
          method: 'POST',
          body: JSON.stringify({
            data: {
              promotedArticles: req.body.articleIDs
            }
          }),
          headers: createRequestHeader()
        });

      if (status === 200) {
        res.send(body.data.promotedArticles);
      } else {
        res.status(status).send(statusText);
      }
    } catch (e) {
      log('error', `Error setting promoted articles in section ID ${ req.params.sectionID }: ${ e }`);
      res.status(500).send(e);
    }
  },
  /**
   * Search for articles in channel
   *
   * @param {object} req
   * @param {object} req.query - query params for search
   * @param {object} res
   * @returns {Promise|Array}
   */
  searchArticlesInChannel = async (req, res) => {
    // query params: fromDate {string}, pageSize {integer}, pageToken {string}, sortDir {string}, toDate {string}

    try {
      const { status, statusText, body: searchResults } = await rest.request(`${ ANF_API_WITH_CHANNEL }articles`, {
        method: 'GET',
        headers: createRequestHeader()
      });

      if (status === 200) {
        res.send(searchResults.data);
      } else {
        res.status(status).send(statusText);
      }
    } catch (e) {
      log('error', `Error getting apple news search results for articles in channel: ${ e }`);
      res.status(500).send(e);
    }
  },
  /**
   * Get article data
   *
   * @param {object} req
   * @param {String} req.params.articleID - article ID
   * @param {object} res
   * @returns {Promise|Object}
   */
  readArticle = async (req, res) => {
    try {
      const { status, statusText, body: article } = await rest.request(`${ ANF_API }articles/${ req.params.articleID }`, {
        method: 'GET',
        headers: createRequestHeader()
      });

      if (status === 200) {
        res.send(article.data);
      } else {
        res.status(status).send(statusText);
      }
    } catch (e) {
      log('error', `Error getting article data from apple news API: ${ e }`);
      res.status(500).send(e);
    }
  },
  /**
   * Publish article to apple news
   *
   * @param {object} req
   * @param {object} req.body - article data to be published
   * @param {object} res
   * @returns {Promise|Object}
   */
  publishArticle = async (req, res) => {
    // https://developer.apple.com/documentation/apple_news/create_an_article
    // TODO

    try {
      const { status, statusText, body: article } = await rest.request(`${ ANF_API }articles`, {
        method: 'POST',
        headers: createRequestHeader(),
        body: JSON.stringify(req.body)
      });

      if (status === 200) {
        res.send(article.data);
      } else {
        res.status(status).send(statusText);
      }
    } catch (e) {
      log('error', `Error publishing article to apple news API: ${ e }`);
      res.status(500).send(e);
    }
  },
  /**
   * Update existing article in apple news channel
   *
   * @param {object} req
   * @param {String} req.params.articleID - article ID
   * @param {object} req.body - updated article data
   * @param {object} res
   * @returns {Promise|Object}
   */
  updateArticle = async (req, res) => {
    // https://developer.apple.com/documentation/apple_news/update_an_article
    // TODO

    try {
      const { status, statusText, body: article } = await rest.request(`${ ANF_API }articles/${ req.params.articleID }`, {
        method: 'POST',
        headers: createRequestHeader(),
        body: JSON.stringify(req.body)
      });

      if (status === 200) {
        res.send(article.data);
      } else {
        res.status(status).send(statusText);
      }
    } catch (e) {
      log('error', `Error updating article in apple news API: ${ e }`);
      res.status(500).send(e);
    }
  },
  /**
   * Delete article in apple news channel
   *
   * @param {object} req
   * @param {String} req.params.articleID - article ID
   * @param {object} res
   * @returns {Promise}
   */
  deleteArticle = async (req, res) => {
    try {
      const { status, statusText } = await rest.request(`${ ANF_API }articles/${ req.params.articleID }`, {
        method: 'DELETE',
        headers: createRequestHeader()
      });

      res.status(status).send(statusText);
    } catch (e) {
      log('error', `Error deleting article with apple news API: ${ e }`);
      res.status(500).send(e);
    }
  },
  /**
   * Add apple news routes to the express app
   *
   * @param {object} app the express app
   */
  inject = (app) => {
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
