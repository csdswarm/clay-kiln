const fs = require('fs'),
  YAML = require('../../../app/node_modules/yamljs'),
  host = process.argv.slice(2)[0],
  layoutType = process.argv.slice(2)[1],
  instanceType = process.argv.slice(2)[2];

if (!host) {
  throw new Error('Missing host');
}

if (!layoutType) {
  throw new Error('Missing layout type.')
}

if (!instanceType) {
  throw new Error('Missing instance type.')
}

// Get current JSON
let data = require(`${__dirname}/${layoutType}-${instanceType}.json`);

// Add global logo sponsorship instance to 'top' area of layout.
const globalLogoSponsorshipRef = `${host}/_components/google-ad-manager/instances/globalLogoSponsorship`;

if (!data.top.find( topRef => topRef['_ref'] === globalLogoSponsorshipRef )) {
  data.top = [...data.top, {'_ref': globalLogoSponsorshipRef}];
}

// Create correct clay data structure
const payload = {
  '_layouts' : {
    [layoutType]: {
      instances: {
        [instanceType]: data
      }
    }
  }
};

fs.writeFile(`${__dirname}/${layoutType}-${instanceType}.yml`, YAML.stringify(payload, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
