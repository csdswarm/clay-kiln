const fs = require('fs'),
  YAML = require('yamljs');

const data = YAML.load(`${__dirname}/layout.yml`);

const bottom = [
  {
    _ref: "clay.radio.com/_components/google-ad-manager/instances/billboardBottom"
  },
  {
    _ref: "clay.radio.com/_components/google-ad-manager/instances/oop"
  },
  {
    _ref: "clay.radio.com/_components/google-ad-manager/instances/mobileAdhesion"
  },
  {
    _ref: "clay.radio.com/_components/station-footer/instances/default"
  },
  {
    _ref: "clay.radio.com/_components/footer/instances/default"
  },
  {
    _ref: "clay.radio.com/_components/nielsen/instances/default"
  },
  {
    _ref: "clay.radio.com/_components/google-ad-manager/instances/mobileInterstitial"
  }
];

data._layouts['one-column-layout'].instances.station.bottom = bottom;

fs.writeFile(`${__dirname}/layout.yml`, YAML.stringify(data, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
