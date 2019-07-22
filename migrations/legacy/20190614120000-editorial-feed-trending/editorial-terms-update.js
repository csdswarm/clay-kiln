const fs = require('fs'),
  YAML = require('../../../app/node_modules/yamljs'),
  host = process.argv.slice(2)[0],
  listInstance = process.argv.slice(2)[1];

if (!host) {
  throw new Error('Missing host');
}

if (!listInstance) {
  throw new Error('Missing instance type.')
}

// Get current JSON
const data = require(`${__dirname}/_lists-${listInstance}.json`),
  newTerm = 'Trending';

if (!data.includes(newTerm)) {
  data.push(newTerm);
}

// Create correct clay data structure
const payload = {
  '_lists' : {
    [listInstance]: data
  }
};

fs.writeFile(`${__dirname}/_lists-${listInstance}.yml`, YAML.stringify(payload, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
