'use strict';

module.exports.save = (ref, data, locals) => {
  if (locals && locals.publishUrl) {
    data.url = locals.publishUrl;
  }

  return data;
};
