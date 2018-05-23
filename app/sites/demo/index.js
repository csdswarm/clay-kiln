'use strict';

const publishing = require('../../services/publishing'),
  mainComponentRefs = ['/_components/article/instances'];

module.exports = function (router, composer) {

  router.get('/', composer);
  router.get('/:section', composer);
  router.get('/:year/:month/:name', composer);
  router.get('/tags/:tag', composer);
  router.get('/tags/:tag/', function (req,res) {
    res.redirect(301, `/tags/${req.params.tag}`);
  });

  return router;
};

// Resolve the url to publish to
module.exports.resolvePublishUrl = [
  (uri, data, locals) => publishing.getYearMonthSlugUrl(data, locals, mainComponentRefs)
];

module.exports.modifyPublishedData = [
  publishing.addLastModified
];
