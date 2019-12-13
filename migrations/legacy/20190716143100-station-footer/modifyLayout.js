const fs = require('fs'),
  YAML = require('yamljs');

const data = YAML.load(`${__dirname}/layout.yml`);

const position = data._layouts['one-column-layout'].instances.station.bottom.findIndex(item => item._ref === '/_components/footer/instances/default');

data._layouts['one-column-layout'].instances.station.bottom.splice(position - 1, 0, {
  _ref: "/_components/station-footer/instances/default"
});

fs.writeFile(`${__dirname}/layout.yml`, YAML.stringify(data, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
