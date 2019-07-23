const fs = require('fs'),
  YAML = require('../../../app/node_modules/yamljs'),
  host = process.argv.slice(2)[0],
  listType = process.argv.slice(2)[1];

if (!host) {
  throw new Error('Missing host');
}

if (!listType) {
  throw new Error('Missing list type.')
}

// Get current JSON
const data = require(`${__dirname}/lists-${listType}.json`),
  sectionFrontOption = {
    id: 'section-front',
    title: '2. Section Front',
    children: [{
      id: 'section-front',
      title: 'Section Front'
    }]
  };
let newData = data;

if (data.length === 1 || data[1].id !== 'section-front') {
  if (data[0].id === 'General-content') {
    newData = [...data, sectionFrontOption];
  } else {
    newData = [{
      id: "General-content",
      title: "1. General Content",
      children: data
    }, sectionFrontOption];
  }
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
