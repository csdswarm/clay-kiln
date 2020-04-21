const fs = require('fs'),
    stationPage = require('./stationPage.json'),
    host = process.argv[2];

if (!stationPage.head.some(link => link.includes('branch-io'))) {
    stationPage.head.push(`${host}/_components/branch-io/instances/station`)
}

fs.writeFile(`${__dirname}/stationPage.json`, JSON.stringify(stationPage), function(err) {
    if (err) throw err;
  }
);