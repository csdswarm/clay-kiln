'use strict';
const { getComponentName } = require('clayutils'),
  { listDeepObjects } = require('./utils'),
  dedupeArray = arr => Array.from(new Set(arr)),
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
 * Composes the ancestry for the current component as well as the start of any child components
 * If this is a child component, it may augment its ancestry with its own children
 * @param {string} myUri
 * @param {object} data
 * @param {object?} ancestry - from the locals object (creates a new one if it does not exist on locals)
 * @returns {object} The new or updated ancestry object
 */
function composeAncestry(myUri, data, { ancestry = {} }) {
  try {
    const children = listDeepObjects(data, '_ref').map(({ _ref }) => _ref),
      me = ancestry[myUri] || { name: getComponentName(myUri) };

    me.parents = me.parents || [];
    ancestry[myUri] = me;

    for (const ref of children) {
      const child = ancestry[ref] = ancestry[ref] || { name: getComponentName(ref), parents: [] };

      child.parents = dedupeArray([...child.parents, myUri]);
    }

  } catch (error) {
    console.error('error', 'There was an error', error );
  }

  return ancestry;
}

/**
 * A higher-order function wrapper for component models.
 *
 * @param {UnityComponentModel} options
 * @returns {object}
 */
function unityComponent({ render = returnData, save = returnData }) {
  return {
    render(uri, data, locals) {
      const isBootstrapping = !locals;

      if (isBootstrapping) {
        return data;
      }

      locals.ancestry = composeAncestry(uri, data, locals);

      // add object to be used for any computed data that should not be saved, automatically include a parents reference
      data._computed = { ...data._computed || {}, parents: locals.ancestry[uri].parents };

      return render(uri, data, locals);
    },
    save(uri, data, locals) {
      const isBootstrapping = !locals;

      if (isBootstrapping) {
        return data;
      }

      // ensure computed data doesn't get saved to db
      delete data._computed;

      return save(uri, data, locals);
    }
  };
}

module.exports = {
  unityComponent
};
