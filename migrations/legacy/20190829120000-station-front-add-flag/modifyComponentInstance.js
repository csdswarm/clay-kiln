const fs = require('fs'),
  YAML = require('yamljs'),
  yamlData = YAML.load(`${__dirname}/stationFront.yml`),
  host = process.argv.slice(2)[0];

if (!host) {
  throw new Error('Missing host');
}

yamlData._components['section-front'].instances['station-basic-music'].stationFront = true;

fs.writeFile(`${__dirname}/stationFront.yml`, YAML.stringify(yamlData, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
