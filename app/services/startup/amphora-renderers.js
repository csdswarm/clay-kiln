'use strict';

const pkg = require('../../package.json'),
  amphoraHtml = require('amphora-html'),
  amphoraRss = require('amphora-rss'),
  helpers = require('../universal/helpers'),
  resolveMediaService = require('../server/resolve-media'),
  { prepare } = require('../universal/spaLink'),
  cheerio = require('cheerio'),
  /**
   * take the html rendered by handlebars and modify all links to add appropriate classes and no follow
   * a third argument containing locals is also sent to postRender method in case it is needed
   *
   * @param {string} ref
   * @param {string} html
   * @return {*}
   */
  transformHtml = async (ref, html) => {
    const $ = cheerio.load(html);

    await prepare($);

    return $.html();
  };


amphoraHtml.configureRender({
  editAssetTags: true,
  cacheBuster: pkg.version
});

amphoraHtml.addResolveMedia(resolveMediaService);
amphoraHtml.addHelpers(helpers);
amphoraHtml.addEnvVars(require('../../client-env.json'));
amphoraHtml.addPlugins([{ postRender: transformHtml }]);

module.exports = {
  default: 'html',
  html: amphoraHtml,
  rss: amphoraRss
};
