const fs = require('fs'),
  stationMetaTitleJson = require(`${__dirname}/stationMetaTitle.json`),
  stationMetaDescriptionJson = require(`${__dirname}/stationMetaDescription.json`),
  host = process.argv.slice(2)[0];

if (!host) {
  throw new Error('Missing host');
}

stationMetaTitleJson.metaLocalsKey = 'station.metaTitle';
stationMetaDescriptionJson.localsKey = 'station.metaDescription';

fs.writeFile(`${__dirname}/stationMetaTitle.json`, JSON.stringify(stationMetaTitleJson), 'utf8', function(err) {
    if (err) throw err;
  }
);

fs.writeFile(`${__dirname}/stationMetaDescription.json`, JSON.stringify(stationMetaDescriptionJson), 'utf8', function(err) {
    if (err) throw err;
  }
);