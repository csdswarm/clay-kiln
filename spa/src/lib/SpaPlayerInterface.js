/**
 *
 * SpaPlayerInterface library contains communications/management logic related to the radio-web-player.
 *
 * See also: app/services/client/ClientPlayerInterface.js
 *
 */

import * as mutationTypes from '../vuex/mutationTypes'
import SpaCommunicationBridge from './SpaCommunicationBridge'
import QueryPayload from './QueryPayload'
const spaCommunicationBridge = SpaCommunicationBridge()
const queryPayload = new QueryPayload()

class SpaPlayerInterface {
  constructor (spaApp) {
    this.spa = spaApp
    this.attachClientEventListeners()
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
      const stationDetailPageStationId = this.extractStationIdFromSpaPayload()

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
    const matchedStationDetailRoute = path.match(/^\/(.+)\/listen$/)

    if (matchedStationDetailRoute) {
      return true
    } else {
      return false
    }
  }

  /**
   *
   * Mount, initialize, store player in Vuex, and attach client.js event listeners.
   *
   * Player will be available throught the SPA afterwards via $store.state.radioPlayer.
   *
   */
  async bootPlayer () {
    if (!this.playerBooted()) {
      await this.mountPlayer()
      this.initializePlayerAndLoadIntoStore()
    }
  }

  /**
   *
   * Lazy-load the player libraries and assets into the DOM, and mount player
   * onto the page.
   *
   */
  async mountPlayer () {
    // Instruct web-player/client.js to mount the player.
    const playerMounted = await spaCommunicationBridge.sendMessage('ClientWebPlayerMountPlayer')

    // Verify player is mounted.
    if (playerMounted) {
      return true
    } else {
      throw new Error('Radio Player failed to mount correctly.')
    }
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
   * Attach event listeners that allow client.js code to interact with
   * the player.
   *
   */
  attachClientEventListeners () {
    // Add channel that listens for play/pause button clicks.
    if (!spaCommunicationBridge.channelActive('SpaPlayerInterfacePlaybackStatus')) {
      spaCommunicationBridge.addChannel('SpaPlayerInterfacePlaybackStatus', async (payload) => {
        const { stationId, playbackStatus } = payload

        if (stationId) {
          await this.play(stationId)
        } else {
          await this[playbackStatus]()
        }
      })
    }
    // Add channel that communicates currently loaded station id.
    if (!spaCommunicationBridge.channelActive('SpaPlayerInterfaceGetCurrentStationId')) {
      spaCommunicationBridge.addChannel('SpaPlayerInterfaceGetCurrentStationId', async () => {
        const currentStation = this.getCurrentStation()
        return currentStation.id
      })
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

    const currentStation = this.getCurrentStation()

    // Set station.
    if (stationId && (!currentStation || currentStation.id !== stationId)) {
      await this.loadStation(stationId)
    }

    // If stationId wasn't passed in, pull currently playing
    // station from player to set stationId.
    if (!stationId) {
      if (currentStation) {
        stationId = currentStation.id
      } else {
        throw new Error('Unable to determine playback station.')
      }
    }

    // Comminucate play status to client.js
    await spaCommunicationBridge.sendMessage('ClientWebPlayerPlaybackStatus', {
      stationId,
      playbackStatus: 'play'
    })
  }

  /**
   * Pause radio station stream
   */
  async pause () {
    await this.spa.$store.state.radioPlayer.playerControls.pause()

    await spaCommunicationBridge.sendMessage('ClientWebPlayerPlaybackStatus', {
      playbackStatus: 'pause'
    })
  }

  /**
   *
   * Get the station that is currently loaded in the player.
   *
   * TODO - replace this with call to actual RadioPlayer.getCurrentStationId()
   * public method when it becomes available.
   *
   * See: https://bitbucket.org/entercom/rad-web-player/pull-requests/28/player-390-added-method-to-return-current/diff
   *
   */
  getCurrentStation () {
    return (
      this.spa.$store.state.radioPlayer.stationDetails &&
        this.spa.$store.state.radioPlayer.stationDetails.dataModel &&
        this.spa.$store.state.radioPlayer.stationDetails.dataModel.currentStation
    )
      ? this.spa.$store.state.radioPlayer.stationDetails.dataModel.currentStation
      : null
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
   * Attempt to get a station ID from a station detail page SPA payload.
   *
   */
  extractStationIdFromSpaPayload () {
    const stationDetailData = queryPayload.findComponent(this.spa.$store.state.spaPayload.main, 'station-detail')

    if (stationDetailData && stationDetailData.station) {
      return stationDetailData.station.id
    } else {
      return null
    }
  }
}

export default SpaPlayerInterface
