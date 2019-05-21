'use strict';

module.exports['1.0'] = function (uri, data) {
  return {...data, titleLocked: data.sectionFront ? true : false, primary: data.sectionFront ? true : false };
};
