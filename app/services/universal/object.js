'use strict';

const
  /**
   * Returns the value from an object based on the key string
   *
   * @param {object} object
   * @param {string} keys - representation of the keys as a string
   * @returns {*}
   */
  getKeysValue = (object, keys) =>
    keys
      .replace(/\[(\d)+\]/g, '.$1') // handle array bracket notation
      .split('.') // create an array
      .reduce((obj, key) => obj && obj[key] ? obj[key] : undefined, object); // go through each key returning the value of that key

module.exports.getKeysValue = getKeysValue;
