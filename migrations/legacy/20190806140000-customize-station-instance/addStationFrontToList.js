const fs = require('fs'),
  YAML = require('../../../app/node_modules/yamljs');

const data = YAML.load(`${__dirname}/list.yml`);

const newStationFront = { id: 'station-basic-music', title: 'Basic Music' };
const stationsList = { id: 'stations', title: '3. Stations', children: [ newStationFront ] };

const newPages = data._lists['new-pages'];

// Check if stations exists in the list
const stationsIndex = newPages.findIndex(({ id }) => id === stationsList.id);

if (stationsIndex === -1) {
  newPages.push(stationsList);
} else {
  newPages[stationsIndex].children.push(newStationFront);
}

data._lists['new-pages'] = newPages;

fs.writeFile(`${__dirname}/list.yml`, YAML.stringify(data, 6, 2), 'utf8', function(err) {
  if (err) throw err;
});
