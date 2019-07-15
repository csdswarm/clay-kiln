'use strict';

const pkg = require('../../package.json'),
  amphoraHtml = require('amphora-html'),
  amphoraRss = require('amphora-rss'),
  helpers = require('../universal/helpers'),
  resolveMediaService = require('../server/resolve-media'),
  { prepare } = require('../universal/spaLink'),
  cheerio = require('cheerio'),
  transformHtml = html => {
    const $ = cheerio.load(html);

    prepare($);

    return $.html();
  };


amphoraHtml.configureRender({
  editAssetTags: true,
  cacheBuster: pkg.version
});

amphoraHtml.addResolveMedia(resolveMediaService);
amphoraHtml.addHelpers(helpers);
amphoraHtml.addEnvVars(require('../../client-env.json'));
amphoraHtml.addPlugins([{ postRender: transformHtml }])

module.exports = {
  default: 'html',
  html: amphoraHtml,
  rss: amphoraRss
};
