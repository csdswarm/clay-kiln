const fs = require('fs'),
  YAML = require('../../../app/node_modules/yamljs');

const data = YAML.load(`${__dirname}/page.yml`);

const stationFront = data._pages['station-front-3'];

if (stationFront.customUrl) {
  delete stationFront.customUrl;
}

if (stationFront.pageHeader === 'pageHeader') {
  stationFront.pageHeader = [ '/_components/topic-page-header/instances/new' ];
}

if (stationFront.layout === '/_layouts/one-column-layout/instances/station') {
  stationFront.layout = '/_layouts/one-column-layout/instances/station-basic-music';
}

// Setup station specific components to be new instances
stationFront.topSection = [ '/_components/station-nav/instances/new' ];
stationFront.bottomSection = [ '/_components/station-footer/instances/new' ];

// Rename other station-front-3 instance references to station-basic-music
stationFront.head = stationFront.head.map(_ref => _ref.replace(/station\-front\-3$/, 'station-basic-music'));
stationFront.main = stationFront.main.map(_ref => _ref.replace(/station\-front\-3$/, 'station-basic-music'));

// rename to station-basic-music
data._pages['station-basic-music'] = stationFront;
delete data._pages['station-front-3'];

fs.writeFile(`${__dirname}/page.yml`, YAML.stringify(data, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
