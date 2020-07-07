const fs = require('fs'),
  YAML = require('yamljs');

const data = YAML.load(`${__dirname}/layout.yml`);

const top = [
    {
      "_ref": "/_components/top-nav/instances/default"
    },
    {
      "_ref": "/_components/station-nav/instances/default"
    },
    {
      "_ref": "/_components/google-ad-manager/instances/globalLogoSponsorship"
    }
  ];

data._layouts['one-column-layout'].instances.station = {
  ...data._layouts['one-column-layout'].instances.general,
};
delete data._layouts['one-column-layout'].instances.general;
delete data._components;

data._layouts['one-column-layout'].instances.station.top = top;

fs.writeFile(`${__dirname}/layout.yml`, YAML.stringify(data, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
