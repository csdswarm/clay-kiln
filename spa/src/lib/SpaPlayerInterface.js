/**
 *
 * SpaPlayerInterface library contains communications/management logic related to the radio-web-player.
 *
 * See also: app/services/client/ClientPlayerInterface.js
 *
 */

import * as mutationTypes from '../vuex/mutationTypes'

class SpaPlayerInterface {
  constructor (spaApp) {
    this.spa = spaApp
  }

  /**
   *
   * Router determines if we should automatically boot the player on intial pageload OR SPA navigation.
   *
   */
  async router () {
    if (!this.playerBooted() && this.autoBootPlayer(this.spa.$route.path)) {
      await this.bootPlayer()

      // If appropriate, pop the player bar onto the screen by loading a station.
      const stationDetailPageStationId = this.extractStationIdFromStationDetailPath(this.spa.$route.path)

      if (stationDetailPageStationId) {
        await this.loadStation(stationDetailPageStationId)
      }
    }
  }

  /**
   *
   * Determine if player has been booted up (player mounted, initialized, and stored in Vuex).
   *
   * @returns {boolean} - whether or not player has been booted.
   */
  playerBooted () {
    return (this.spa.$store.state.radioPlayer !== null)
  }

  /**
   *
   * Determine whether or not to automatically boot up the player
   * based on url path.
   *
   * @param {string} path - Current url path.
   * @returns {boolean} - whether or not to automatically boot the player.
   */
  autoBootPlayer (path) {
    const matchedStationDetailRoute = path.match(/^\/([0-9]+)\/listen$/)

    if (matchedStationDetailRoute) {
      return true
    } else {
      return false
    }
  }

  /**
   *
   * Mount, initialize, and store player in Vuex.
   *
   * Player will be available throught the SPA afterwards via $store.state.radioPlayer.
   *
   */
  async bootPlayer () {
    await this.mountPlayer()
    this.initializePlayerAndLoadIntoStore()
  }

  /**
   *
   * Lazy-load the player libraries and assets into the DOM, and mount player
   * onto the page.
   *
   */
  mountPlayer () {
    return new Promise((resolve, reject) => {
      // Client.js will communicate that player has completed mounting via an event.
      document.addEventListener('spaWebPlayerPlayerMounted', () => {
        if (window.RadioPlayer) {
          return resolve(true)
        } else {
          return reject(new Error('Radio Player failed to mount correctly.'))
        }
      })

      // Kick-off mounting of player in web-player client.js
      const event = new CustomEvent('clientWebPlayerMountPlayer')
      document.dispatchEvent(event)
    })
  }

  /**
   *
   * Initialize the radio web player and persist it into Vuex.
   *
   */
  initializePlayerAndLoadIntoStore () {
    if (window.RadioPlayer) {
      // Initialize the player prior to persisting it in the Vuex store.
      window.RadioPlayer.initialize()
      this.spa.$store.commit(mutationTypes.LOAD_RADIO_PLAYER, window.RadioPlayer)
    } else {
      throw new Error('Attempted to init and load player before it has been mounted.')
    }
  }

  /**
   *
   * Play radio station stream.
   *
   * If stationId is passed, player will load that station and then play.
   * Otherwise player will play the station that is currently loaded.
   *
   * IMPORTANT: Autoplay on initial pageload does not always work on Chrome and Firefox.
   * See: https://entercomdigitalservices.atlassian.net/browse/ON-133?focusedCommentId=75260&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-75260
   *
   */
  async play (stationId = null) {
    // Verify player is booted first.
    if (!this.playerBooted()) {
      await this.bootPlayer()
    }

    // Set station.
    if (stationId) {
      await this.loadStation(stationId)
    }

    // Begin playback of audio.
    this.spa.$store.state.radioPlayer.play()
  }

  /**
   *
   * Load a station into the player. Must be called before play().
   *
   * @param {number} stationId - id of station of load.
   */
  async loadStation (stationId) {
    await this.spa.$store.state.radioPlayer.updateStationList([stationId])
  }

  /**
   *
   * Get a station ID related to a station detail page via url path.
   *
   * @param {string} path - url path.
   */
  extractStationIdFromStationDetailPath (path) {
    const match = path.match(/^\/([0-9]+)\/listen$/)

    return (match) ? match[1] : null
  }
}

export default SpaPlayerInterface
