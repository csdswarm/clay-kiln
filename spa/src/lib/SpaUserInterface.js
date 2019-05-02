/**
 *
 * SpaUserInterface library contains communications/management logic related to the radio-web-player.
 *
 * See also: app/services/client/ClientUserInterface.js
 *
 */

import SpaCommunicationBridge from './SpaCommunicationBridge'
import * as actionTypes from '../vuex/actionTypes'
const spaCommunicationBridge = SpaCommunicationBridge()

class SpaUserInterface {
  constructor (spaApp) {
    this.spa = spaApp
    this.attachClientEventListeners()
    this.attachDOMEventListeners()
  }

  /**
   *
   * Attach event listeners that allow client.js code to interact with
   * the player.
   *
   */
  attachClientEventListeners () {
    // Add channel for favoriting stations
    if (!spaCommunicationBridge.channelActive('SpaUserFavorite')) {
      spaCommunicationBridge.addChannel('SpaUserFavorite', (payload) => {
        const { action, stationId } = payload

        return this[action](stationId)
      })
    }
  }

  /**
   *
   * Attach event listeners to DOM
   * the player.
   *
   */
  attachDOMEventListeners () {
    this.spa.$el.querySelectorAll('[data-fav-station]').forEach(element => {
      element.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()

        const currentClass = Array.from(element.classList).find((className) => /-active$/i.test(className))
        const nextClass = currentClass.includes('--active')
          ? currentClass.replace('--active', '--not-active')
          : currentClass.replace('--not-active', '--active')
        const func = currentClass.includes('--active') ? 'removeFavorite' : 'addFavorite'

        if (this[func](element.dataset.favStation)) {
          document.querySelectorAll(`[data-fav-station="${element.dataset.favStation}"]`).forEach(station =>
            station.classList.replace(currentClass, nextClass)
          )
        }
      })
    })
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
