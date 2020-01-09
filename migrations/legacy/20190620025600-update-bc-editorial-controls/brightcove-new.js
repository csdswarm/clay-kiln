const fs = require('fs'),
  brightcoveNewJson = require(`${__dirname}/brightcove-new.json`),
  host = process.argv.slice(2)[0];

if (!host) {
  throw new Error('Missing host');
}

brightcoveNewJson.clickToPlay = false;
brightcoveNewJson.autoplayUnmuted = false;

fs.writeFile(`${__dirname}/brightcove-new.json`, JSON.stringify(brightcoveNewJson), 'utf8', function(err) {
    if (err) throw err;
  }
);
