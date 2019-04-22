'use strict';

const fs = require('fs'),
  mappingsJSON = require(`${__dirname}/mappings.json`),
  settingsJSON = require(`${__dirname}/settings.json`),
  host = process.argv.slice(2)[0],
  alias = process.argv.slice(3)[0];

if (!host) {
  throw new Error('Missing host');
}

if (!alias) {
  throw new Error('Missing alias');
}

// update lead to be dynamic so it has a _ref and data
mappingsJSON[alias].mappings._doc.properties.lead = {
  type: "nested",
  dynamic: "true",
  properties: {
    _ref: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256
        }
      }
    },
    data: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256
        }
      }
    }
  }
};

const newIndex = {
  mappings: mappingsJSON[alias].mappings,
  settings: {
    analysis: settingsJSON[alias].settings.index.analysis
  }
}

fs.writeFile(`${__dirname}/new-index.json`, JSON.stringify(newIndex), 'utf8', function(err) {
    if (err) throw err;
  }
);
