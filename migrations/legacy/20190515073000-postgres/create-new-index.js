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

// only make changes if needed --> if new-index.json doesn't exist, reindex doesn't need to happen
if (!mappingsJSON[alias].mappings._doc.properties.urlHistory) {
  // update urlHistory to be dynamic so it has a _ref and data
  mappingsJSON[alias].mappings._doc.properties.urlHistory = {
    type: "text"
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
}
