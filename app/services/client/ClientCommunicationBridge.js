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
 * UPDATE: It may be possible with @babel/runtime library. See SpaCommunicationBridge for more.
 *
 */

// Require dependencies.
const uuidv4 = require('uuid/v4');

// Config settings.
// eslint-disable-next-line one-var
const LISTENER_TYPE_NAMESPACE = 'communicationBridge'; // Shared namespace for Client/Spa CommunicationBridge listeners since we use global window as EventTarget.
// eslint-disable-next-line one-var
const DEFAULT_MESSAGE_TIMEOUT = 5000; // How long in milliseconds before timing out messages.

class ClientCommunicationBridge {

  constructor() {
    // Store of all active client.js channels.
    this.channels = {};
  }

  /**
   * Get namespace specific id
   *
   * @param {string} channelName
   * @returns {string} channelId
   */
  getChannelId(channelName) {
    return `${LISTENER_TYPE_NAMESPACE}ClientChannel${channelName}`;
  }

  /**
   * Return channel or create a new one
   *
   * @param {string} channelName
   * @param {boolean} [createIfUndefined]
   * @returns {string}
   */
  getChannel(channelName, createIfUndefined) {
    const channelId = this.getChannelId(channelName);

    if (!this.channels[channelId] && createIfUndefined) {
      this.channels[channelId] = {listeners: []};
    }

    return this.channels[channelId];
  }

  /**
   *
   * Use to determine if a channel has already been added.
   *
   * @param {string} channelName - Check if this channel is active
   * @returns {boolean} - whether or not a channel with this name is active.
   */
  channelActive(channelName) {
    return !!this.getChannel(channelName);
  }

  /**
   * Return the last payload returned in the channel
   *
   * @param {String} channelName
   * @param {*} [ifUndefined]
   *
   * @returns {*} latest channel state
   */
  getLatest(channelName, ifUndefined) {
    const channel = this.getChannel(channelName);

    if (!channel) {
      throw new Error(`Channel ${channelName} does not exist.`);
    }

    return channel.state || ifUndefined;
  }

  /**
   *
   * Subscribe to a Client.js channel that listens for messages from SPA code.
   *
   * @param {string} channelName - Recieve messages sent to this channel name.
   * @param {function} handler - Handler function to execute when a message hits this channel.
   * @returns {function} unsubscribe
   */
  subscribe(channelName, handler) {
    const channel = this.getChannel(channelName, true),
      channelId = this.getChannelId(channelName),
      channelListener = async (event) => {
        // Extract data from message event detail.
        const { id, payload: messagePayload } = event.detail;

        channel.state = messagePayload;

        // Execute the handler callback.
        // eslint-disable-next-line one-var
        const responsePayload = await Promise.all(channel.listeners.map(func => func(messagePayload)));

        // Send response
        // eslint-disable-next-line one-var
        const responseEvent = new CustomEvent(`${LISTENER_TYPE_NAMESPACE}SpaMessage${channelName}-${id}`, {
          detail: { payload: responsePayload }
        });

        document.dispatchEvent(responseEvent);
      };

    document.addEventListener(channelId, channelListener);

    channel.listeners.push(handler);

    return () => this.unsubscribe(channelName, handler);
  }

  /**
   *
   * Unsubscribe from a Client channel
   *
   * @param {string} channelName - Channel that needs to be unsubscribed from
   * @param {function} handler - Handler function to execute when a message hits this channel.
   */
  unsubscribe(channelName, handler) {
    const channel = this.getChannel(channelName);

    this.channels[channel] = channel.listeners.filter(listener => listener !== handler);
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
      const messageType = `${LISTENER_TYPE_NAMESPACE}ClientMessage${channelName}-${id}`;

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
      const spaMessageEvent = new CustomEvent(`${LISTENER_TYPE_NAMESPACE}SpaChannel${channelName}`, {
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
