'use strict';

/**
 * A script to go through Elasticsearch and convert domain names.
 * Usage:
 *    node change-published-content-domain.js http localhost:9200 www.radio.com clay.radio.com
 *    node change-published-content-domain.js https vpc-prdcms2-elasticsearch-nigdljt33pc6yi6rr4ijbheqbu.us-east-1.es.amazonaws.com www.radio.com pre-prod.radio.com
 */

const headers = {
    'Content-Type': 'application/json'
  },
  httpOrHttps = process.argv.slice(1)[1],
  elasticsearchHost = process.argv.slice(2)[1],
  oldDomain = process.argv.slice(3)[1],
  newDomain = process.argv.slice(4)[1],
  {v1: {httpRequest}} = require('../utils/migration-utils')
;

if (!httpOrHttps) {
  console.log('Error: Must provide and http/https');
  process.exit();
}

if (!elasticsearchHost) {
  console.log('Error: Must provide and Elasticsearch host (with/without port number');
  process.exit();
}

if (!oldDomain) {
  console.log('Error: Must provide old domain name');
  process.exit();
}

if (!newDomain) {
  console.log('Error: Must provide a new domain name');
  process.exit();
}

// Elastic is updated via a script
const body = {
  "script": {
    "inline": "ctx._source.adTags._ref = ctx._source.adTags._ref.replace(params.oldUrl, params.newUrl); for (content in ctx._source.content) { content._ref = content._ref.replace(params.oldUrl, params.newUrl); content.data = content.data.replace(params.oldUrl, params.newUrl) } for (breadcrumb in ctx._source.breadcrumbs) { breadcrumb.url = breadcrumb.url.replace(params.oldUrl, params.newUrl) } ctx._source.contentPageSponsorLogo._ref = ctx._source.contentPageSponsorLogo._ref.replace(params.oldUrl, params.newUrl); ctx._source.canonicalUrl = ctx._source.canonicalUrl.replace(params.oldUrl, params.newUrl); ctx._source.sideShare._ref = ctx._source.sideShare._ref.replace(params.oldUrl, params.newUrl); for (lead in ctx._source.lead) { lead._ref = lead._ref.replace(params.oldUrl, params.newUrl); lead.data = lead.data .replace(params.oldUrl, params.newUrl); } if (ctx._source.feedImg != null) {ctx._source.feedImg._ref = ctx._source.feedImg._ref.replace(params.oldUrl, params.newUrl); }",
    "lang": "painless",
    "params": {
      "oldUrl": oldDomain,
      "newUrl": newDomain
    }
  }
};

// Make the update
httpRequest({http: httpOrHttps, method: 'POST', url: `${httpOrHttps}://${elasticsearchHost}/published-content/_update_by_query`, body, headers})
  .then(response => JSON.parse(response.data))
  .then(data => {
    console.dir(data);
    if (data.error) {
      console.error('Error updating elasticsearch domains: ', data.error);
      process.exit();
    } else {
      console.log(`Updated published-content index domain names from ${oldDomain} to ${newDomain}`);
    }
  });


