'use strict';

module.exports['1.0'] = (uri, data) => {
  data.defaultDescription = data.description;

  return data;
};
