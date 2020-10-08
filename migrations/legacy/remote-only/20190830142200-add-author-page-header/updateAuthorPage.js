const fs = require ('fs'),
    authorPage = require('./authorPage.json'),
    authorPageHeaderRef = process.argv.slice(2)[0];
   
authorPage.pageHeader = [...(authorPage.pageHeader || []), authorPageHeaderRef]

fs.writeFile('./authorPage.json', JSON.stringify(authorPage), 'utf-8', function (err) {
    if (err) return console.log(err);
  });