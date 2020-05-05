'use strict';

// NOTE: This is a new front-end util service that will need to consolidate
// existing client-side ONLY utils into itself on another ticket (ON-XXXX)

// TODO: create  fe utils consolidation ticket

class Utils {
  constructor() {}

  truncate(str, limit, options = {}) {
    options.useSuffix = options.useSuffix || false;
    options.suffix = options.suffix || '...';
    if (str.length < limit) {
      return str;
    } else {
      return `${str.slice(0, limit).trim()}${options.useSuffix ? options.suffix : ''}`;
    }
  }
};

module.exports.utils = new Utils();
