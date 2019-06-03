'use strict';

module.exports['1.0'] = function (uri, data) {
  return {...data, titleLocked: data.title.length > 0, primary: data.title.length > 0 };
};
