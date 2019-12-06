'use strict';

const rest = require('../universal/rest'),
  /**
   * Retrieve a list through the /_lists endpoint
   *
   * @param {string} name - The name of the list
   * @returns {Promise<any[]>}
   */
  retrieveList = (name) => {
    return rest.get(`${ window.location.origin }/_lists/${ name }`);
  };

module.exports.retrieveList = retrieveList;
module.exports.uncacheList = () => Promise.resolve();
