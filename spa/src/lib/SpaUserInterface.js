/**
 *
 * SpaUserInterface library contains communications/management logic related to the radio-web-player.
 *
 * See also: app/services/client/ClientUserInterface.js
 *
 */

import SpaCommunicationBridge from './SpaCommunicationBridge'
import ClientUserInterface from '../../../app/services/client/ClientUserInterface'
import * as actionTypes from '../vuex/actionTypes'
const spaCommunicationBridge = SpaCommunicationBridge()

class SpaUserInterface {
  constructor (spaApp) {
    this.spa = spaApp
    this.attachClientCommunication()

    // Attach event listeners to DOM
    ClientUserInterface().addEventListener(this.spa.$el)
  }

  /**
   *
   * Attach event listeners that allow client.js code to interact with
   * the client.
   *
   */
  attachClientCommunication () {
    // Add channel for favoriting stations
    if (!spaCommunicationBridge.channelActive('SpaUserFavorite')) {
      spaCommunicationBridge.subscribe('SpaUserFavorite', (payload) => {
        const { action, stationId } = payload

        return this[action](stationId)
      })
    }
  }

  /**
   * add a station to the users favorites when they are logged in
   *
   * @param {number} stationId
   * @return {boolean}
   */
  addFavorite (stationId) {
    if (this.spa.$store.state.user.email) {
      this.spa.$store.dispatch(actionTypes.FAVORITE_STATIONS_ADD, stationId)
      return true
    } else {
      this.spa.$router.push('/account/login')
      return false
    }
  }

  /**
   * remove a station from the users favorites
   *
   * @param {number} stationId
   * @return {boolean}
   */
  removeFavorite (stationId) {
    this.spa.$store.dispatch(actionTypes.FAVORITE_STATIONS_REMOVE, stationId)
    return true
  }
}

export default SpaUserInterface
