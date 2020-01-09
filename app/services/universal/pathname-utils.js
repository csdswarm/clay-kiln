'use strict';

/**
 * README
 *   Just a collection of pathname utilities I didn't know where else to put.
 */

/**
 * Turns '/some/pathname/' into 'some/pathname'
 *
 * @param {string} pathname
 * @returns {string}
 */
module.exports.stripOuterSlashes = (pathname) => pathname.replace(/^\/|\/$/g, '');
