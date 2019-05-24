'use strict';

const rest = require('../universal/rest');

module.exports = async (contentUrl) => {
  const response = await rest.get(contentUrl);

  console.log({response});
  
  return contentUrl;
};
