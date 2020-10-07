const fs = require ('fs'),
    newPageList = require('./newPageList.json'),
    getId = obj => obj.id;

newPageList.map(group => {
    if (group.id.toLowerCase() === 'section-front') {
        if (!group.children.map(getId).includes('podcast-front')) {
            group.children.push({
              id: 'podcast-front',
              title: 'Podcast Front'
            })
        }
    }
});

fs.writeFile('./newPageList.json', JSON.stringify(newPageList), 'utf-8', function (err) {
  if (err) return console.log(err);
});
