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
  },
  /**
   * Gets the display name for a section front slug. Returns the slug if not found.
   *
   * @param {string} slug - The section front's ID
   * @param {object[]} data - The section front list
   * @returns {Promise<string>}
   */
  getSectionFrontName = (slug, data) => {
    const entry = data.find(entry => entry.value === slug);

    return entry ? entry.name : slug;
  };

module.exports.retrieveList = retrieveList;
module.exports.getSectionFrontName = getSectionFrontName;

// Returns a resolved promise to ensure API compatibility with the server counterpart
module.exports.uncacheList = () => Promise.resolve();
