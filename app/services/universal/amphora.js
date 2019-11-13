'use strict';
const { getComponentName } = require('clayutils'),
  returnData = (_, data) => data;

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
      const ancestry = locals.ancestry || [],
        parent = ancestry.slice(-1)[0];

      // add current component to ancestry so that children can find their parents
      ancestry.push({ name: getComponentName(uri), ref: uri });
      locals.ancestry = ancestry;

      // add object to be used for any computed data that should not be saved, automatically include a parent reference
      data._computed = Object.assign({ parent }, data._computed);

      return render(uri, data, locals);
    },
    save(uri, data, locals) {
      // ensure computed data doesn't get saved to db
      delete data._computed;

      return save(uri, data, locals);
    }
  };
}

module.exports = {
  unityComponent
};
