const fs = require('fs'),
  YAML = require('yamljs');

const data = YAML.load(`${__dirname}/page.yml`);

const stationFront = data._pages['station-front-3'];

if (stationFront.customUrl) {
  delete stationFront.customUrl;
}

if (stationFront.pageHeader === 'pageHeader') {
  stationFront.pageHeader = '/_components/topic-page-header/instances/new';
}

data._pages['station-front-3'] = stationFront;

fs.writeFile(`${__dirname}/page.yml`, YAML.stringify(data, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
