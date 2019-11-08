'use strict';

/**
 * Notes
 * - See Notes under server/loaded-ids.js for the purpose of this file.
 */

const api = {};

/**
 * An api compatible placeholder
 * @returns {Promise}
 */
api.clear = () => Promise.resolve();

/**
 * An api compatible placeholder
 * @returns {Promise}
 */
api.get = () => Promise.resolve([]);

/**
 * An api compatible placeholder
 * @returns {Promise}
 */
api.append = () => Promise.resolve();

/**
 * An api compatible placeholder
 * @returns {Promise}
 */
api.lazilyGetFromLocals = () => Promise.resolve([]);

/**
 * An api compatible placeholder
 * @returns {Promise}
 */
api.lazilyGetFromLocals = () => Promise.resolve([]);

/**
 * An api compatible placeholder
 * @returns {Promise}
 */
api.appendToLocalsAndRedis = () => Promise.resolve();

module.exports = api;
