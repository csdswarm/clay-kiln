'use strict';
const { unityComponent } = require('../../services/universal/amphora');

// module.exports = unityComponent({
//   render: (uri, data, locals) => {
//     if (locals.station.description) {
//       data._computed.description = locals.station.description;
//     };
//     return data;
//   },
//   save: (uri, data, locals) => {
//     if (locals.station.description) {
//       data._computed.description = locals.station.description;
//     };
//     return data;
//   },
// });
module.exports.save = (uri, data, locals) => {
    console.log('SAVE META-DESCRIPTION: ', locals.station.name);
    if (locals.station.description) {
      data.description = locals.station.description;
    } else {
      data.description = 'test';
    }
    return data;
}
module.exports.render = (uri, data, locals) => {
    console.log('RENDERING META_DESCRIPTION: ', locals.station.name)
    return data;
}