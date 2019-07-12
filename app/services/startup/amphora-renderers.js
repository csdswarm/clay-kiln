'use strict';

const pkg = require('../../package.json'),
  amphoraHtml = require('amphora-html'),
  amphoraRss = require('amphora-rss'),
  helpers = require('../universal/helpers'),
  resolveMediaService = require('../server/resolve-media'),
  { prepare } = require('../universal/spaLink'),
  JSDOM = require('jsdom').jsdom;

amphoraHtml.configureRender({
  editAssetTags: true,
  cacheBuster: pkg.version,
  transformHtml: html => {
    const doc = new JSDOM(html);

    prepare(doc);

    return doc.body.innerHTML;
  }
});

amphoraHtml.addResolveMedia(resolveMediaService);
amphoraHtml.addHelpers(helpers);
amphoraHtml.addEnvVars(require('../../client-env.json'));

module.exports = {
  default: 'html',
  html: amphoraHtml,
  rss: amphoraRss
};

