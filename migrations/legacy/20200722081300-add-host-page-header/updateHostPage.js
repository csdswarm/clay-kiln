const fs = require ('fs'),
    hostPage = require('./hostPage.json'),
    hostPageHeaderRef = process.argv.slice(2)[0];
   
hostPage.pageHeader = [...(hostPage.pageHeader || []), hostPageHeaderRef]

fs.writeFile('./hostPage.json', JSON.stringify(hostPage), 'utf-8', function (err) {
    if (err) return console.log(err);
  });