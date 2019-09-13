'use strict';

function rndInt(min = 0, max = 1) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
function rndPick(array) {
  return array[rndInt(0,array.length - 1)];
}
function getItems(num = 6) {
  const items = [];
  
  for (let i = 0; i < num; i++) {
    let item;

    item = {
      img: `https://placeimg.com/300/300/animals/${rndInt(1,10)}`,
      title: 'Faucibus a pellentesque sit amet porttitor eget dolorssss.',
      category: rndPick(['music', 'news', 'sports']),
      link: '/foo'
    };
    items.push(item);
  }
  return items;
}

module.exports.render = (ref, data, locals) => {
  data.items = getItems(locals.query.numItems);
  return data;
};
