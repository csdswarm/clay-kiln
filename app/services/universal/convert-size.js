'use strict';

const unitToExponent = {
  b: 0,
  kb: 3,
  mb: 6,
  gb: 9
};

/**
 * converts value from one unit to another
 *
 * note: the result will likely givve you a lot of decimal places due to
 *   floating point innacuracies.  If this becomes an issue we can solve it
 *   using 'exact-math' or another library on npm.
 *
 * @param {number} value
 * @param {object} argObj
 * @param {string} argObj.from - one of the supported units (see above)
 * @param {string} argObj.to - one of the supported units (see above)
 * @returns {number}
 */
module.exports = (value, { from, to }) => {
  const fromExp = unitToExponent[from.toLowerCase()],
    toExp = unitToExponent[to.toLowerCase()];

  return value * Math.pow(10, fromExp - toExp);
};
