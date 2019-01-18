var fs = require('fs');
const listPath = 'app/first-run/galleries-update/lists.yml';

fs.readFile(listPath, 'utf-8', function(err, oldList) {
  console.log("Old List: ", oldList);
  let newList = oldList.concat(`\
    - id: gallery
      title: New Gallery
  `);
  console.log("Updated List: ", newList);
  fs.writeFile(listPath, newList, 'utf-8', function (err) {
    if (err) return console.log(err);
  });
});
