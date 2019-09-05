const fs = require('fs'),
  YAML = require('yamljs'),
  PATH = `${__dirname}/layout.yml`,
  basicMusic = YAML.load(PATH);

  // Remove topic-page-header
  basicMusic._pages['station-basic-music'].pageHeader = basicMusic._pages['station-basic-music'].pageHeader.filter(ref => !(/topic\-page\-header/.test(ref)));

  // Add site slug field to component
  basicMusic._components['section-front'].instances['station-basic-music'].stationSiteSlug = '';

  fs.writeFile(PATH, YAML.stringify(basicMusic, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  });
