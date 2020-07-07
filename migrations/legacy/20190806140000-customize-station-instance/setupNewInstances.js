const fs = require('fs'),
  YAML = require('../../../app/node_modules/yamljs');

const headerData = YAML.load(`${__dirname}/stationNav.yml`);
const footerData = YAML.load(`${__dirname}/stationFooter.yml`);
const header = headerData._components['station-nav'].instances.default;
const footer = footerData._components['station-footer'].instances.default;

header.station = null;
header.stationLogo = '';
header.primaryLinks = [];

headerData._components['station-nav'].instances.new = header;
delete headerData._components['station-nav'].instances.default;

footer.station = null;
footer.socialButtons = [];

footerData._components['station-footer'].instances.new = footer;
delete footerData._components['station-footer'].instances.default;

fs.writeFile(`${__dirname}/stationNavNew.yml`, YAML.stringify(headerData, 6, 2), 'utf8', function(err) {
	if (err) throw err;
	
	fs.writeFile(`${__dirname}/stationFooterNew.yml`, YAML.stringify(footerData, 6, 2), 'utf8', function(err) {
		if (err) throw err;
	});
});
