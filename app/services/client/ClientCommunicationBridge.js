'use strict';

/**
 *
 * This Service contains logic that facilitates bi-directional
 * asynchronous communication between client.js code and the SPA.
 *
 * See also : SpaCommunicationBridge.js
 * NOTE: It is not possible to create one unified CommunicationBridge.js shared library because of
 * interoperability issues related to client.js using commonJS module format and the SPA
 * using es6 module format.
 *
 */

// Require dependencies.
const uuidv4 = require('uuid/v4');

// Config settings.
// eslint-disable-next-line one-var
const LISTENER_TYPE_NAMESPACE = 'COMMUNICATION_BRIDGE'; // Shared namespace for Client/Spa CommunicationBridge listeners since we use global window as EventTarget.
// eslint-disable-next-line one-var
const DEFAULT_MESSAGE_TIMEOUT = 5000; // How long in milliseconds before timing out messages.

class ClientCommunicationBridge {

  constructor() {
    // Store of all active client.js channels.
    this.channels = {};
  }

  addChannel() {
    // TODO: Add a client.js channel. This is stubbed out. It will be completed as part of tech debt "SPA events accessible from client.js files".
    // https://entercomdigitalservices.atlassian.net/wiki/spaces/UNITY/pages/204701707/Tech+Debt
  }

  removeChannel() {
    // TODO: Remove a client.js channel. This is stubbed out. It will be completed as part of tech debt "SPA events accessible from client.js files".
    // https://entercomdigitalservices.atlassian.net/wiki/spaces/UNITY/pages/204701707/Tech+Debt
  }

  /**
   *
   * Send a message to a SPA channel.
   *
   * @param {string} channelName - SPA channel to recieve message.
   * @param {*} payload - data payload associated with message.
   * @param {*} timeout - timeout in ms.
   * @returns {Promise<any>} - Response payload from SPA channel.
   */
  sendMessage(channelName, payload, timeout = null) {
    return new Promise((resolve, reject) => {
      // Generate unique id used to track this message.
      const id = uuidv4();

      // Define temporary type for message event.
      // eslint-disable-next-line one-var
      const messageType = `${LISTENER_TYPE_NAMESPACE}-client-message-${channelName}-${id}`;

      // Define message response listener.
      // eslint-disable-next-line one-var
      const listener = (event) => {
        // Extract data from event detail
        const { payload } = event.detail;

        // Detach temporary message event listener associated with this message.
        document.removeEventListener(messageType, listener);

        return resolve(payload);
      };

      // Attach temporary message response event listener.
      document.addEventListener(messageType, listener);

      // Message timeout logic.
      timeout = timeout || DEFAULT_MESSAGE_TIMEOUT;
      setTimeout(() => {
        // Detach temporary message event listener associated with this message.
        document.removeEventListener(messageType, listener);
        // Timeout promise.
        return reject(new Error(`Message to ${channelName} with id:${id} timed out in ${timeout} ms.`));
      }, timeout);

      // Send SPA message event.
      // eslint-disable-next-line one-var
      const spaMessageEvent = new CustomEvent(`${LISTENER_TYPE_NAMESPACE}-spa-channel-${channelName}`, {
        detail: {
          id,
          payload
        }
      });

      document.dispatchEvent(spaMessageEvent);
    });
  }

}

/**
 *
 * CommunicationBridge should only be accessed as a singleton,
 * so only export singleton factory.
 *
 */
let clientCommunicationBridgeSingleton = null;

module.exports = function () {
  if (clientCommunicationBridgeSingleton) {
    return clientCommunicationBridgeSingleton;
  } else {
    clientCommunicationBridgeSingleton = new ClientCommunicationBridge();
    return clientCommunicationBridgeSingleton;
  }
};
