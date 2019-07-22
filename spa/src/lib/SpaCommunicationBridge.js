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
import uuidv4 from 'uuid/v4'

// Config settings.
const LISTENER_TYPE_NAMESPACE = 'communicationBridge' // Shared namespace for Client/Spa CommunicationBridge listeners since we use global window as EventTarget.
const DEFAULT_MESSAGE_TIMEOUT = 5000 // How long in milliseconds before timing out messages.

class SpaCommunicationBridge {
  constructor () {
    // Store of all active SPA channels.
    this.channels = {}
  }

  /**
   * Get namespace specific id
   *
   * @param {string} channelName
   * @returns {string} channelId
   */
  getChannelId (channelName) {
    return `${LISTENER_TYPE_NAMESPACE}SpaChannel${channelName}`
  }

  /**
   * Return channel or create a new one
   *
   * @param {string} channelName
   * @param {boolean} [createIfUndefined]
   * @returns {string}
   */
  getChannel (channelName, createIfUndefined) {
    const channelId = this.getChannelId(channelName)

    if (!this.channels[channelId] && createIfUndefined) {
      this.channels[channelId] = { listeners: [] }
    }

    return this.channels[channelId]
  }

  /**
   *
   * Use to determine if a channel has already been added.
   *
   * @param {string} channelName - Check if this channel is active
   * @returns {boolean} - whether or not a channel with this name is active.
   */
  channelActive (channelName) {
    return !!(this.getChannel(channelName))
  }

  /**
   * Return the last payload returned in the channel
   *
   * @param {*} channelName
   * @param {boolean} [ifUndefined]
   *
   * @returns {object} latest channel state
   */
  getLatest (channelName, ifUndefined) {
    const channel = this.getChannel(channelName)

    if (!channel) {
      throw new Error(`Channel ${channelName} does not exist.`)
    }

    return channel.state || ifUndefined
  }

  /**
   *
   * Subscribe to a SPA channel that listens for messages from client.js code.
   *
   * @param {string} channelName - Recieve messages sent to this channel name.
   * @param {function} handler - Handler function to execute when a message hits this channel.
   */
  subscribe (channelName, handler) {
    const channel = this.getChannel(channelName, true)
    const channelId = this.getChannelId(channelName)
    const channelListener = async (event) => {
      // Extract data from message event detail.
      const { id, payload: messagePayload } = event.detail

      channel.state = messagePayload

      // Execute the handler callback.
      const responsePayload = await Promise.all(channel.listeners.map(func => func(messagePayload)))

      // Send response
      const responseEvent = new CustomEvent(`${LISTENER_TYPE_NAMESPACE}ClientMessage${channelName}-${id}`, {
        detail: { payload: responsePayload }
      })

      document.dispatchEvent(responseEvent)
    }

    document.addEventListener(channelId, channelListener)

    channel.listeners.push(handler)

    return () => this.unsubscribe(channelName, handler)
  }

  /**
   *
   * Unsubscribe from a SPA channel
   *
   * @param {string} channelName - Channel that needs to be unsubscribed from
   * @param {function} handler - Handler function to execute when a message hits this channel.
   */
  unsubscribe (channelName, handler) {
    const channel = this.getChannel(channelName)

    if (!channel) {
      throw new Error(`Channel ${channelName} does not exist.`)
    } else {
      this.channels[channel] = channel.filter(listener => listener !== handler)
    }
  }

  /**
   *
   * Send a message to a Client.js channel.
   *
   * @param {string} channelName - Client.js channel to recieve message.
   * @param {*} [payload] - data payload associated with message.
   * @param {*} [timeout] - timeout in ms.
   * @returns {Promise<any>} - Response payload from Client.js channel.
   */
  sendMessage (channelName, payload, timeout = null) {
    return new Promise((resolve, reject) => {
      // Generate unique id used to track this message.
      const id = uuidv4()

      // Define temporary type for message event.
      // eslint-disable-next-line one-var
      const messageType = `${LISTENER_TYPE_NAMESPACE}SpaMessage${channelName}-${id}`

      // Define message response listener.
      // eslint-disable-next-line one-var
      const listener = (event) => {
        // Extract data from event detail
        const { payload } = event.detail

        // Detach temporary message event listener associated with this message.
        document.removeEventListener(messageType, listener)

        return resolve(payload)
      }

      // Attach temporary message response event listener.
      document.addEventListener(messageType, listener)

      // Message timeout logic.
      timeout = timeout || DEFAULT_MESSAGE_TIMEOUT
      setTimeout(() => {
        // Detach temporary message event listener associated with this message.
        document.removeEventListener(messageType, listener)
        // Timeout promise.
        return reject(new Error(`Message to ${channelName} with id:${id} timed out in ${timeout} ms.`))
      }, timeout)

      // Send Client.js message event.
      // eslint-disable-next-line one-var
      const clientMessageEvent = new CustomEvent(`${LISTENER_TYPE_NAMESPACE}ClientChannel${channelName}`, {
        detail: {
          id,
          payload
        }
      })

      document.dispatchEvent(clientMessageEvent)
    })
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
