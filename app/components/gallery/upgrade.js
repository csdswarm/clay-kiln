'use strict';

module.exports['1.0'] = (uri, data) => {
  return {
    ...data,
    footer: []
  };
};
