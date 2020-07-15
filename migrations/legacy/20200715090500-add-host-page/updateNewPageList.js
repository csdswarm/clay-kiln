// const fs = require ('fs'),
//     newPageList = require('./newPageList.json'),
//     getId = obj => obj.id;
    
// newPageList.map(group => {
//     if (group.id.toLowerCase() === 'general-content') {
//         if (!group.children.map(getId).includes('author-profile')) {
//             group.children.push({
//                 id: 'author-profile',
//                 title: 'Author Page'
//             })
//         }
//     }
// });

// fs.writeFile('./newPageList.json', JSON.stringify(newPageList), 'utf-8', function (err) {
//     if (err) return console.log(err);
//   });