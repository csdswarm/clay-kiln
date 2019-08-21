const fs = require('fs'),
  YAML = require('../../../app/node_modules/yamljs');

/**
 * Split array of { _ref } into 3 sections
 * @param {Array} section
 * @param {String} ref
 */
function splitSectionOn(section, ref) {
  const sections = [],
    index = section.findIndex(({ _ref }) => _ref === ref);

  sections.push(section.slice(0, index));
  sections.push([{ _ref: ref }]);
  sections.push(section.slice(index + 1));

  return sections;
}

const data = YAML.load(`${__dirname}/layout.yml`);

const stationLayout = data._layouts['one-column-layout'].instances.station;

// Split top and bottom on the station-nav and station-footer
const topSplit = splitSectionOn(stationLayout.top, '/_components/station-nav/instances/default');
const bottomSplit = splitSectionOn(stationLayout.bottom, '/_components/station-footer/instances/default');

stationLayout.top = topSplit[0];
stationLayout.topSection = topSplit[1];
stationLayout.topAd = topSplit[2];

stationLayout.bottomAd = bottomSplit[0];
stationLayout.bottomSection = bottomSplit[1];
stationLayout.bottom = bottomSplit[2];

delete data._layouts['one-column-layout'].instances.station;
data._layouts['one-column-layout'].instances['station-basic-music'] = stationLayout;

fs.writeFile(`${__dirname}/layout.yml`, YAML.stringify(data, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
