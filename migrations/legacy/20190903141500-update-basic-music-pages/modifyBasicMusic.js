const fs = require('fs'),
  YAML = require('yamljs'),
  PATH = `${__dirname}/layout.yml`,
  basicMusic = YAML.load(PATH),
  stationFront = basicMusic._components['section-front'].instances['station-basic-music'];

// Remove topic-page-header
basicMusic._pages['station-basic-music'].pageHeader = basicMusic._pages['station-basic-music'].pageHeader.filter(ref => !(/topic\-page\-header/.test(ref)));

// Add site slug field to component, station-fronts are always primary,
// and generate computed fields so kiln can propery reveal imporant fields.
stationFront.stationSiteSlug = '';
stationFront.primary = true;
stationFront.revealStationControls = true;
stationFront.revealSectionFrontControls = false;

basicMusic._components['section-front'].instances['station-basic-music'] = stationFront;

fs.writeFile(PATH, YAML.stringify(basicMusic, 6, 2), 'utf8', function(err) {
  if (err) throw err;
});
