'use strict';

module.exports['1.0'] = function (uri, data) {
  return {
    ...data,
    description: [data.description]
  };
};
