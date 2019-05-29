'use strict';

// const rest = require('../universal/rest'),
//   importContentUrl = 'some url';

module.exports = async (contentUrl) => {
  try {
    // TODO connect to actual import url
    // await rest.get(importContentUrl);
    
    return contentUrl;
  } catch (e) {
    console.error(e);
    return null;
  }
};
