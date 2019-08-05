const fs = require('fs'),
  stationDetailJSON = require(`${__dirname}/station-detail.json`),
  host = process.argv.slice(2)[0];

if (!host) {
  throw new Error('Missing host');
}

stationDetailJSON.favoritesComponent = {
    _ref: `${host}/_components/station-favorites/instances/default`
}

fs.writeFile(`${__dirname}/station-detail.json`, JSON.stringify(stationDetailJSON), 'utf8', function(err) {
    if (err) throw err;
  }
);