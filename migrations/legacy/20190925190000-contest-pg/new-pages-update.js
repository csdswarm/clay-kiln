const fs = require('fs'),
  YAML = require('../../../app/node_modules/yamljs'),
  host = process.argv.slice(2)[0],
  listType = process.argv.slice(2)[1],
  _find = require('../../../app/node_modules/lodash/find'),
  _findIndex = require('../../../app/node_modules/lodash/findIndex'),
  _set = require('../../../app/node_modules/lodash/set');

if (!host) {
  throw new Error('Missing host');
}

if (!listType) {
  throw new Error('Missing list type.')
}

// Get current JSON
const data = require(`${__dirname}/lists-${listType}.json`),
  contest = {
    id: 'contest',
    title: 'Contest'
  };

const generalContentPages = _find(data, { id: 'General-content' }),
  generalContentPagesIndex = _findIndex(data, { id: 'General-content' });
let newData = data;

if (!_find(generalContentPages.children, function(page) {
  return 'contest' === page.id;
})) {
  _set(newData[generalContentPagesIndex], 'children',
    [ ...generalContentPages.children, contest]);
}

// Create correct clay data structure
const payload = {
  '_lists' : {
    [listType]: newData
  }
};

fs.writeFile(`${__dirname}/lists-${listType}.yml`, YAML.stringify(payload, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
