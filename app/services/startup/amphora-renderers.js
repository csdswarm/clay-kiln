'use strict';

const pkg = require('../../package.json'),
  amphoraHtml = require('amphora-html'),
  amphoraRss = require('amphora-rss'),
  amphoraAppleNews = require('amphora-apple-news'),
  helpers = require('../universal/helpers'),
  resolveMediaService = require('../server/resolve-media'),
  { prepare } = require('../universal/spaLink'),
  cheerio = require('cheerio'),
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

module.exports = {
  default: 'html',
  gnf: amphoraRss,
  html: amphoraHtml,
  rss: amphoraRss,
  msn: amphoraRss,
  'smart-news': amphoraRss,
  postup: amphoraRss,
  anf: amphoraAppleNews
};
