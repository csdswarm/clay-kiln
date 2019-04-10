'use strict'

/**
 *
 * This Service contains logic that facilitates bi-directional
 * asynchronous communication between SPA code and client.js code.
 *
 * See also : ClientCommunicationBridge.js
 * NOTE: It is not possible to create one unified CommunicationBridge.js shared library because of
 * interoperability issues related to client.js using commonJS module format and the SPA
 * using es6 module format.
 *
 * UPDATE: We may be able to unify SpaCommunicationBridge and ClientCommunicationBridge by implementing the
 * @babel/runtime package. It may be an issue with how we use babel to bundle client.js code and also in our
 * SPA bundle build - I'm thinking each babel build is transforming the module correctly but then putting it in a
 * global namespace such that both bundles are colliding in that namespace at runtime thus causing the commonJS/ES6 module
 * interoperability problems (That's the only explanation I can think of that would cause 2 discrete builds to use
 * the same resource at runtime).
 *
 * @babel/runtime may add that missing method interopRequireDefault() which could resolve this issue.
 *
 * Unrelated but similar issue: https://github.com/facebook/react-native/issues/21310#issuecomment-424452875
 *
 */

// Require dependencies.
// import uuidv4 from 'uuid/v4' // TODO - Uncoment when sendMessage() is implemented.

// Config settings.
const LISTENER_TYPE_NAMESPACE = 'communicationBridge' // Shared namespace for Client/Spa CommunicationBridge listeners since we use global window as EventTarget.
// const DEFAULT_MESSAGE_TIMEOUT = 5000 // How long in milliseconds before timing out messages. TODO - Uncoment when sendMessage() is implemented.

class SpaCommunicationBridge {
  constructor () {
    // Store of all active SPA channels.
    this.channels = {}
  }

  /**
   *
   * Use to determine if a channel has already been added.
   *
   * @param {string} channelName - Check if this channel is active
   * @returns {boolean} - whether or not a channel with this name is active.
   */
  channelActive (channelName) {
    return !!(this.channels[`${LISTENER_TYPE_NAMESPACE}SpaChannel${channelName}`])
  }

  /**
   *
   * Add a SPA channel that listens for messages from client.js code.
   *
   * @param {string} channelName - Recieve messages sent to this channel name.
   * @param {function} handler - Handler function to execute when a message hits this channel.
   */
  addChannel (channelName, handler) {
    const channel = `${LISTENER_TYPE_NAMESPACE}SpaChannel${channelName}`

    if (this.channels[channel]) {
      throw new Error(`Channel ${channelName} already exists.`)
    } else {
      const channelListener = async (event) => {
        // Extract data from message event detail.
        const { id, payload: messagePayload } = event.detail

        // Execute the handler callback.
        // eslint-disable-next-line one-var
        const responsePayload = await handler(messagePayload)

        // Send response
        // eslint-disable-next-line one-var
        const responseEvent = new CustomEvent(`${LISTENER_TYPE_NAMESPACE}ClientMessage${channelName}-${id}`, {
          detail: { payload: responsePayload }
        })

        document.dispatchEvent(responseEvent)
      }

      document.addEventListener(channel, channelListener)
      this.channels[channel] = channelListener
    }
  }

  removeChannel () {
    // TODO: Remove a SPA channel. This is stubbed out. It will be completed as part of tech debt "SPA events accessible from client.js files".
    // https://entercomdigitalservices.atlassian.net/wiki/spaces/UNITY/pages/204701707/Tech+Debt
  }

  sendMessage () {
    // TODO: Send a message to a client.js channel. This is stubbed out. It will be completed as part of tech debt "SPA events accessible from client.js files".
    // https://entercomdigitalservices.atlassian.net/wiki/spaces/UNITY/pages/204701707/Tech+Debt
  }
}

let spaCommunicationBridgeSingleton = null

// eslint-disable-next-line one-var
export default function () {
  if (spaCommunicationBridgeSingleton) {
    return spaCommunicationBridgeSingleton
  } else {
    spaCommunicationBridgeSingleton = new SpaCommunicationBridge()
    return spaCommunicationBridgeSingleton
  }
}
