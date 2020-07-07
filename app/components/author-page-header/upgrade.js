'use strict';

module.exports['1.0'] = (uri, data) => {
  delete data.dynamic;
  delete data.socialLinks;
  return data;
};
