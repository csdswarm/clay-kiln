'use strict';

/**
 * Ensures 'str' starts with 'prefix'
 *
 * This function is meant to be used in a mapper.  e.g.
 *
 * allUris = allUris.map(ensureStartsWith('@published'))
 *
 * @param {string} suffix - the string that should be at the end of 'str'
 * @returns {function}
 */
const ensureStartsWith_v1 = prefix => str => {
  return str.startsWith(prefix)
    ? str
    : prefix + str;
}

module.exports = {
  v1: ensureStartsWith_v1
};
