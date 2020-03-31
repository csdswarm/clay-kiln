'use strict';

const clientCommunicationBridge = require('./ClientCommunicationBridge')();

/**
 *
 * ClientStateIInterface library contains communications/management logic related to the Vue State.
 *
 * See also: spa/src/lib/SpaStateInterface.js
 *
 */
class ClientStateIInterface {
  /**
   *
   * Get a the Vuex state
   *
   * @param {String} [variable]
   * @returns {Promise<Object>}
   */
  async getState(variable) {
    return await clientCommunicationBridge.sendMessage('SpaStateInterfaceState', variable);
  }

  /**
   * @param {string[]} loadedIds - the
   */
  setLoadedIds(loadedIds) {
    clientCommunicationBridge.sendMessage('SpaStateInterface_SetLoadedIds', loadedIds);
  }
}

// Export to factory to simplify standard import statements.
module.exports = function () {
  return new ClientStateIInterface();
};
