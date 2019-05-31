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
let data = require(`${__dirname}/${layoutType}-${instanceType}.json`)

// Strip web-player-head component from headLayout.
data.headLayout = data.headLayout.filter((item) => {
  if (item._ref.includes('web-player-head')) {
    return false;
  } else {
    return true;
  }
})

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
