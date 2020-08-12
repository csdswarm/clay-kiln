'use strict';

// NOTE: This is a new front-end util service that will need to consolidate
// existing client-side ONLY utils into itself on another ticket (ON-XXXX)

// TODO: create  fe utils consolidation ticket

class Utils {
  constructor() {}

  /**
   * truncates string to limit and adds suffix if set
   *
   * @param {string} str
   * @param {number} limit
   * @param {object} [options={}]
   * @returns {string}
   * @memberof Utils
   */
  truncate(str, limit, options = {}) {
    options.useSuffix = options.useSuffix || false;
    options.suffix = options.suffix || '...';
    if (str.length < limit) {
      return str;
    } else {
      return `${str.slice(0, limit).trim()}${options.useSuffix ? options.suffix : ''}`;
    }
  }

  /**
   * strips all html from string replacing with empty by default
   *
   * @param {*} str
   * @param {string} [replace='']
   * @returns {string}
   * @memberof Utils
   */
  stripHtml(str, replace = '') {
    return str.replace(/(<([^>]+)>)/ig, replace);
  }
};

module.exports.utils = new Utils();
