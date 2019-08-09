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
}

// Export to factory to simplify standard import statements.
module.exports = function () {
  return new ClientStateIInterface();
};
