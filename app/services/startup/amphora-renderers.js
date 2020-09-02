'use strict';

const _set = require('lodash/set'),
  amphoraAppleNews = require('amphora-apple-news'),
  amphoraHtml = require('amphora-html'),
  amphoraRss = require('amphora-rss'),
  cheerio = require('cheerio'),
  helpers = require('../universal/helpers'),
  pkg = require('../../package.json'),
  resolveMediaService = require('../server/resolve-media'),
  { prepare } = require('../universal/spaLink'),
  /**
   * take the html rendered by handlebars and modify all links to add appropriate classes and no follow
   *
   * @param {string} ref
   * @param {string} html
   * @param {object} locals
   * @return {*}
   */
  transformHtml = (ref, html, locals) => {
    const $ = cheerio.load(html);

    prepare($, locals.ENTERCOM_DOMAINS);

    return $.html();
  };


amphoraHtml.configureRender({
  editAssetTags: true,
  cacheBuster: process.env.NODE_ENV === 'production' ? pkg.version : Date.now()
});

amphoraHtml.addResolveMedia(resolveMediaService);
amphoraHtml.addHelpers(helpers);
amphoraHtml.addEnvVars(require('../../client-env.json'));
amphoraHtml.addPlugins([{ postRender: transformHtml }]);

const feeds = ['freq', 'gnf', 'msn', 'postup', 'rss', 'smart-news']
  .reduce((result, key) => _set(result, key, amphoraRss), {});

module.exports = Object.assign(
  {
    default: 'html',
    html: amphoraHtml,
    anf: amphoraAppleNews
  },
  feeds
);
