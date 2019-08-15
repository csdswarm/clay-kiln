const fs = require('fs'),
  YAML = require('yamljs');

const data = YAML.load(`${__dirname}/layout.yml`);

const bottomAdSlot = [ {
  _ref: "/_components/google-ad-manager/instances/billboardBottom"
}, {
  _ref: "/_components/google-ad-manager/instances/oop"
}, {
  _ref: "/_components/google-ad-manager/instances/mobileAdhesion"
}, {
  _ref: "/_components/nielsen/instances/default"
} ];

const bottom = data._layouts['one-column-layout'].instances.station.bottom.filter((item) => !(/google\-ad\-manager|nielsen/.test(item._ref)));

data._layouts['one-column-layout'].instances.station.bottom = bottom;
data._layouts['one-column-layout'].instances.station.bottom._page = true;
data._layouts['one-column-layout'].instances.station.bottomAdSlot = bottomAdSlot;

fs.writeFile(`${__dirname}/layout.yml`, YAML.stringify(data, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
