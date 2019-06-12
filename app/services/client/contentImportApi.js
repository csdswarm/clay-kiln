'use strict';

const rest = require('../universal/rest');

module.exports = async (content) => {
  try {
    const [results] = await rest.post('/import-content', content);

    return results;
  } catch (e) {
    console.error(e);
    return null;
  }
};
