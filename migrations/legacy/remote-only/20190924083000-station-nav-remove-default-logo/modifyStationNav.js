const fs = require('fs'),
  YAML = require('yamljs'),
  PATH = `${__dirname}/component.yml`,
  stationNav = YAML.load(PATH);

// Remove default stationLogo from station-nav
stationNav._components['station-nav'].instances.new.stationLogo = '';

fs.writeFile(PATH, YAML.stringify(stationNav, 6, 2), 'utf8', function(err) {
  if (err) throw err;
});
