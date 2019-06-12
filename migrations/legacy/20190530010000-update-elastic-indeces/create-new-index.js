'use strict';

const fs = require('fs'),
  mappingsJSON = require(`${__dirname}/mappings.json`),
  settingsJSON = require(`${__dirname}/settings.json`),
  alias = process.argv.slice(2)[0],
  indexPrefix = process.argv.slice(3)[0];
let indexUpdated = false;

if (!alias) {
  throw new Error('Missing alias');
}

// only make changes if needed --> if new-index.json doesn't exist, reindex doesn't need to happen
if (mappingsJSON[alias].mappings._doc.dynamic) {
  delete mappingsJSON[alias].mappings._doc.dynamic;
  indexUpdated = true;
}

if (indexPrefix == 'layouts' && !mappingsJSON[alias].mappings._doc.properties.createdAt) {
  mappingsJSON[alias].mappings._doc.properties.createdAt = {"type": "date"};
  delete mappingsJSON[alias].mappings._doc.properties.createTime;
  indexUpdated = true;
}

if (indexUpdated) {
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
