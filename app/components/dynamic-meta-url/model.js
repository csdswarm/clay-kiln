'use strict';

module.exports.render = (ref, data, locals) => {
  // ON-560 canonicals should be https
  if (locals && locals.url) {
    data.localUrl = locals.url.replace('http:', 'https:');
  }
  return data;
};

module.exports.save = (ref, data, locals) => {
  if (locals && locals.publishUrl) {
    data.url = locals.publishUrl;
  }

  return data;
};
