'use strict';

const returnData = (_, data) => data;

/**
 * @typedef ModelCallback
 * @param {string} uri
 * @param {object} data
 * @param {object} [locals]
 * @returns {object}
 *
 * @typedef UnityComponentModel
 * @type {object}
 * @property {ModelCallback} [render]
 * @property {ModelCallback} [save]
 */

/**
 * A higher-order function wrapper for component models.
 *
 * @param {UnityComponentModel} options
 * @returns {object}
 */
function unityComponent({ render = returnData, save = returnData }) {
  return {
    render(uri, data, locals) {
      // add empty object to be used for any computed data that should not be saved
      if (typeof data._computed === 'undefined') data._computed = {};

      return render(uri, data, locals);
    },
    save(uri, data, locals) {
      // ensure computed data doesn't get saved to db
      delete data._computed;

      return save(uri, data, locals);
    }
  };
}

module.exports.unityComponent = unityComponent;
