const fs = require('fs'),
  pageJSON = require(`${__dirname}/page.json`),
  host = process.argv.slice(2)[0],
  componentPath = process.argv.slice(2)[1];

if (!host || !componentPath) {
  throw new Error('Missing host or componentPath');
}

let stationsCarousel = `${host}/_components/stations-carousel/instances/404`,
    latestContent = `${host}/_components/latest-content/instances/default`;

if (!pageJSON.main.includes(stationsCarousel)) pageJSON.main.push(stationsCarousel);
if (!pageJSON.main.includes(latestContent)) pageJSON.main.push(latestContent);

fs.writeFile(`${__dirname}/page.json`, JSON.stringify(pageJSON), 'utf8', function(err) {
    if (err) throw err;
  }
);