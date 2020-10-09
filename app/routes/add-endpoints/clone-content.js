'use strict';

const _get = require('lodash/get'),
  _omit = require('lodash/omit'),
  db = require('../../services/server/db'),
  utils = require('../../services/universal/utils'),
  { createPage } = require('../../services/server/page-utils'),
  protocol = process.env.CLAY_SITE_PROTOCOL,
  rest = require('../../services/universal/rest'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils');

const removeSectionFronts = (content) => ({
    ...content,
    secondarySectionFront: '',
    sectionFront: ''
  }),

  // remove all props added by create-content/index.js -> assignStationInfo
  removeStationProps = content => _omit(content, [
    'stationCallsign',
    'stationLogoUrl',
    'stationName',
    'stationSlug',
    'stationTimezone',
    'stationURL'
  ]),

  googleAdManagerInstance = '/_components/google-ad-manager/instances',

  removeAdsFromCloned = (article) => {
    const adsArray = article.content
        .filter(content => content._ref.includes(googleAdManagerInstance))
        .map(contentObj => contentObj._ref),
      newContent = article.content.filter(content => !content._ref.includes(googleAdManagerInstance));

    // remove created google-ad-manager instances by createPage cloning.
    adsArray.forEach(async adInstance => {
      try {
        await rest.delete(`${protocol}://${adInstance}`, {}, true);
      } catch (err) {
        console.error(err);
      }
    });

    return {
      ...article,
      content: newContent
    };
  },

  updateSyndication = (content, ogCanonicalUrl) => ({
    ...content,
    corporateSyndication: null,
    editorialFeeds: null,
    genreSyndication: null,
    isCloned: true,
    stationSyndication: [],
    syndicatedUrl: ogCanonicalUrl,
    syndicationStatus: 'syndicated'
  }),

  cloneContent = wrapInTryCatch(async (req, res) => {
    const { canonicalUrl, stationSlug } = req.body,
      pagesUri = req.hostname + '/_pages/',
      { locals } = res,
      url = canonicalUrl.split('//')[1],

      QUERY = `SELECT p.data
      FROM uris u
        JOIN pages p
          ON u.data || '@published' = p.id
      WHERE u.url = ?`;

    let pageBody = await db.raw(QUERY, [url]).then(results => _get(results, 'rows[0].data'));

    if (!pageBody) {
      res.status(404).send({ error: 'Page not found' });
      return;
    }

    pageBody = {
      ...pageBody,
      layout: utils.replaceVersion(pageBody.layout)
    };

    const result = await createPage(pagesUri, pageBody, stationSlug, locals),
      resultContentUri = result.main[0];

    // needs to be declared after resultContentUri
    // eslint-disable-next-line one-var
    let resultContent = await db.get(resultContentUri);

    resultContent = updateSyndication(resultContent, canonicalUrl),
    resultContent = removeSectionFronts(resultContent),
    resultContent = removeAdsFromCloned(resultContent);

    if (!stationSlug) {
      resultContent = removeStationProps(resultContent);
    }

    await db.put(resultContentUri, resultContent);

    res.status(201);
    res.send(result);
  });

module.exports = router => {
  router.post('/rdc/clone-content', cloneContent);
};

// for testing
Object.assign(module.exports, { cloneContent });
