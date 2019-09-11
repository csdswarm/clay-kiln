'use strict';
const items = [{
    "img": "https://placeimg.com/300/300/animals/1",
    "title": "Diam donec adipiscing tristique risus nec feugiat. Etiam erat velit scelerisque in dictum non.",
    "category": "music"
  },
  {
    "img": "https://placeimg.com/300/300/animals/2",
    "title": "Aliquet lectus proin nibh nisl condimentum id.",
    "category": "sports"
  },
  {
    "img": "https://placeimg.com/300/300/animals/7",
    "title": "Eget aliquet nibh praesent tristique.",
    "category": "news"
  },
  {
    "img": "https://placeimg.com/300/300/animals/4",
    "title": "Mauris a diam maecenas sed enim ut sem viverra aliquet.",
    "category": "music"
  },
  {
    "img": "https://placeimg.com/300/300/animals/8",
    "title": "Vestibulum rhoncus est pellentesque elit ullamcorper dignissim cras.",
    "category": "sports"
  },
  {
    "img": "https://placeimg.com/300/300/animals/11",
    "title": "Faucibus a pellentesque sit amet porttitor eget dolorssss.",
    "category": "music"
  }
];

module.exports.render = (ref, data, locals) => {
  data.items = items;
  return data;
};
