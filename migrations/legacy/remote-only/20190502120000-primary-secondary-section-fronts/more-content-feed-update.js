const fs = require('fs'),
  YAML = require('../../../app/node_modules/yamljs'),
  host = process.argv.slice(2)[0],
  componentType = process.argv.slice(2)[1],
  instanceType = process.argv.slice(2)[2];

if (!host) {
  throw new Error('Missing host');
}

if (!componentType) {
  throw new Error('Missing component type.')
}

if (!instanceType) {
  throw new Error('Missing instance type.')
}

// Get current JSON
const data = require(`${__dirname}/${componentType}-${instanceType}.json`)

data.content = [];
delete data.sectionFrontManual;

// Create correct clay data structure
const payload = {
  '_components' : {
    [componentType]: {
      instances: {
        [instanceType]: data
      }
    }
  }
};

fs.writeFile(`${__dirname}/${componentType}-${instanceType}.yml`, YAML.stringify(payload, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
