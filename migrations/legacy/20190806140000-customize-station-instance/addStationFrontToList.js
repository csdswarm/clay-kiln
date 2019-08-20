const fs = require('fs'),
  YAML = require('../../../app/node_modules/yamljs');

const data = YAML.load(`${__dirname}/list.yml`);

const newStationFront = { id: 'station-front-3', title: 'Station Front' };

const newPages = data._lists['new-pages'];

const index = newPages.findIndex(({ id }) => id === 'section-front');
const stationFront = newPages[index].children.find(({ id }) => id === newStationFront.id);

if (stationFront === undefined) {
  newPages[index].children.push(newStationFront);
} else {
  newPages[index].children.splice(
    newPages[index].children.findIndex(({ id }) => id === newStationFront.id),
    1,
    newStationFront
  );
}

data._lists['new-pages'] = newPages;

fs.writeFile(`${__dirname}/list.yml`, YAML.stringify(data, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
