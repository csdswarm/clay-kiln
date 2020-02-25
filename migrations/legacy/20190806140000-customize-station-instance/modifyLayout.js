const fs = require('fs'),
  YAML = require('../../../app/node_modules/yamljs');

/**
 * Split array of { _ref } into 2 sections
 * @param {Array} section
 * @param {String} ref
 */
function splitSectionOn(section, ref) {
  const sections = [],
    index = section.findIndex(({ _ref }) => _ref === ref);

  sections.push(section.slice(0, index));
  sections.push(section.slice(index + 1));

  return sections;
}

const data = YAML.load(`${__dirname}/layout.yml`);

const stationLayout = data._layouts['one-column-layout'].instances.station;

// Split top and bottom on the station-nav and station-footer
const topSplit = splitSectionOn(stationLayout.top, '/_components/station-nav/instances/default');
const bottomSplit = splitSectionOn(stationLayout.bottom, '/_components/station-footer/instances/default');

stationLayout.top = topSplit[0];
stationLayout.topSection = 'topSection';
stationLayout.topAd = topSplit[1];

stationLayout.bottomAd = bottomSplit[0];
stationLayout.bottomSection = 'bottomSection';
stationLayout.bottom = bottomSplit[1];

delete data._layouts['one-column-layout'].instances.station;
data._layouts['one-column-layout'].instances['station-basic-music'] = stationLayout;

fs.writeFile(`${__dirname}/layout.yml`, YAML.stringify(data, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
