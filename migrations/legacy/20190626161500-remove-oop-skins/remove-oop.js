const fs = require('fs'),
  host = process.argv.slice(2)[0],
  oopRef = `${host}/_components/google-ad-manager/instances/oop`,
  stationLayout = require('./stationLayout.json'),
  stationDirectoryOneColumnLayout = require('./stationDirectoryOneColumnLayout.json'),
  stationDirectoryPage = require('./stationDirectoryPage.json');

if (!host) {
  throw new Error('Missing host');
}

stationLayout.bottom = stationLayout.bottom.filter(inst => inst._ref !== oopRef);
stationDirectoryOneColumnLayout.bottom = stationDirectoryOneColumnLayout.bottom.filter(inst => inst._ref !== oopRef);
stationDirectoryPage.layout = `${host}/_layouts/one-column-layout/instances/station-directory`;

fs.writeFile(`${__dirname}/stationLayout.json`, JSON.stringify(stationLayout), function(err) {
    if (err) throw err;
  }
);

fs.writeFile(`${__dirname}/stationDirectoryOneColumnLayout.json`, JSON.stringify(stationDirectoryOneColumnLayout), function(err) {
    if (err) throw err;
  }
);

fs.writeFile(`${__dirname}/stationDirectoryPage.json`, JSON.stringify(stationDirectoryPage), function(err) {
    if (err) throw err;
  }
);