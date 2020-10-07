const fs = require('fs'),
  host = process.argv.slice(2)[0],
  editorialFeedList = require('./editorialFeedList.json')

if (!host) {
  throw new Error('Missing host');
}

['Adult Hits', 'Classic Hits'].forEach(n => {
    if (!editorialFeedList.includes(n)) {
        editorialFeedList.push(n);
    }
})

editorialFeedList.sort();

fs.writeFile(`${__dirname}/editorialFeedList.json`, JSON.stringify(editorialFeedList), function(err) {
    if (err) throw err;
  }
);