const fs = require('fs'),
  layoutJSON = require(`${__dirname}/layout.json`),
  host = process.argv.slice(2)[0],
  componentPath = process.argv.slice(2)[1];

if (!host || !componentPath) {
  throw new Error('Missing host or componentPath');
}

layoutJSON.includeInlineAds = true;

fs.writeFile(`${__dirname}/layout.json`, JSON.stringify(layoutJSON), 'utf8', function(err) {
    if (err) throw err;
  }
);

