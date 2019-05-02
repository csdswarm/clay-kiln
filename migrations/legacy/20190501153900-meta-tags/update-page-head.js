'use strict';

const fs = require('fs'),
  host = process.argv.slice(2)[0],
  pageName = process.argv.slice(2)[1];

if (!host) {
  throw new Error('Missing host');
}

if (!pageName) {
  throw new Error('Missing page name');
}

const pageJSON = require(`${__dirname}/${pageName}.json`),
  metaTagsComponent = `${host}/_components/meta-tags/instances/general`;

if (!pageJSON.head.includes(metaTagsComponent)) {
  pageJSON.head.push(metaTagsComponent);
  fs.writeFile(`${__dirname}/${pageName}-done.json`, JSON.stringify(pageJSON), 'utf8', function(err) {
      if (err) throw err;
    }
  );
}