'use strict';

module.exports['1.0'] = function (uri, data) {
  return {...data, titleLocked: data.title ? true : false, primary: data.title ? true : false };
};
