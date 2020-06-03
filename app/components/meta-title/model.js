'use strict';

const sanitize = require('../../services/universal/sanitize'),
  { unityComponent } = require('../../services/universal/amphora');

// module.exports = unityComponent({
//   render: (uri, data, locals) => {
//     console.log('RENDER: ', locals.station);
//     return data;
//   },
//   save: (uri, data, locals) => {
//     console.log('SAVE: ', locals.station);
//     if (locals.station.name) {
//       data.title       = locals.station.name;
//       data.kilnTitle   = locals.station.name;
//     };
//     return sanitize.recursivelyStripSeperators(data)
//     },
// });

module.exports.save = (uri, data, locals) => {
  console.log('SAVE META-TITLE: ', locals.station.name);
  if (locals.station.name) {
    data.title       = locals.station.name;
    data.kilnTitle   = locals.station.name;
  };
  return sanitize.recursivelyStripSeperators(data)
};
module.exports.render = (uri, data, locals) => {
  console.log('RENDERING META_TITLE: ', locals.station.name)
  return data;
}