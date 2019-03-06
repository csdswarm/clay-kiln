const fs = require('fs'),
  listJSON = require(`${__dirname}/list.json`),
  YAML = require('../../../app/node_modules/yamljs'),
  host = process.argv.slice(2)[0],
  listKey = `${host}/_lists/new-pages`;

if (!host) {
  throw new Error('Missing host');
}

newListJSON = {
  '_lists': {
    'new-pages': [{
      id: 'General-content',
      title: '1. General Content',
      children: listJSON[0].children || listJSON
    }]
  }
};

fs.writeFile(`${__dirname}/list.yml`, YAML.stringify(newListJSON, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);

