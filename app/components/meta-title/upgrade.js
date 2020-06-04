'use strict'

module.exports['1.0'] = (uri, data, locals) => {
    console.log('UPGRADE: ', locals.newPageStation)  
    return data;
  };