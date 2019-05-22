'use strict';

module.exports['1.0'] = function (uri, data) {
  return {...data, titleLocked: data.title !== null, primary: data.title !== null };
};
