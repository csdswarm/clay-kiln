'use strict';

function getItems(num = 6) {
  const items = [];
  
  for (let i = 0; i < num; i++) {
    let item;
    
    item = {
      img: `https://placeimg.com/300/300/animals/${i + 1}`,
      title: 'Faucibus a pellentesque sit amet porttitor eget dolorssss.',
      category: 'music'
    };
    items.push(item);
  }
  return items;
}

module.exports.render = (ref, data, locals) => {
  data.items = getItems(locals.query.numItems);
  return data;
};
