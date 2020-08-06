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
import ClientPlayerInterface from '../../../app/services/client/ClientPlayerInterface'
const spaCommunicationBridge = SpaCommunicationBridge()
const queryPayload = new QueryPayload()
const sessionStorage = window.sessionStorage

class SpaPlayerInterface {
  constructor (spaApp) {
    this.spa = spaApp
    this.playerSession = JSON.parse(sessionStorage.getItem('currentlyPlaying')) || {}
    this.attachClientCommunication()

    // Attach event listeners to DOM
    ClientPlayerInterface().addEventListener(this.spa.$el)
    ClientPlayerInterface().addEventListenerEpisode(this.spa.$el)

    /**
     * Execute web player "routing" logic (determines whether to lazy-load player and auto-initialize player bar).
     *
     * NOTE: router() is async and returns a promise, but onLayoutUpdate() must be synchronous (because Vue lifecycle methods
     * must be synchronous). Since the player exists outside of the slice of DOM managed by the SPA, playerInterface.router() is safe to call
     * as if it was "synchronous" and there is no need to block further execution of onLayoutUpdate() until playerInterface.router() resolves.
     */
    this.router()
  }

  /**
   *
   * Router determines if we should automatically boot the player on intial pageload OR SPA navigation.
   *
   */
  async router () {
    if (!this.playerBooted() && this.autoBootPlayer(this.spa.$route.path)) {
      await this.bootPlayer()

      const { podcastId, episodeId } = this.extractPodcastEpisodeIdFromSpaPayload()

      if (podcastId && episodeId) {
        await this.loadEpisode(podcastId, episodeId)
      } else {
        // If appropriate, pop the player bar onto the screen by loading a station.
        const stationId = this.extractStationIdFromSpaPayload() || this.playerSession.id

        if (stationId) {
          await this.loadStation(stationId)
        }
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
    const matchedStationDetailRoute = path.match(/^\/podcasts\/(.+)\/(.+)$/) || path.match(/^\/(.+)\/listen$/)
    const playerWasActive = this.playerSession.playerState === 'play'

    if (matchedStationDetailRoute || playerWasActive) {
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
   * get the next type of button based off of the current state
   * @param {string } current
   * @return {string}
   */
  getPlayState (current) {
    const interactive = window.RadioPlayer.stationDetails.dataModel.currentStation.attributes.interactive || window.RadioPlayer.streamType

    if (current === 'play') {
      return interactive ? 'pause' : 'stop'
    }

    return 'play'
  }

  /**
   *
   * Lazy-load the player libraries and assets into the DOM, and mount player
   * onto the page.
   *
   */
  async mountPlayer () {
    // Instruct web-player/client.js to mount the player.
    const playerMounted = await spaCommunicationBridge.sendMessage('ClientWebPlayerMountPlayer', true)

    // Verify player is mounted.
    if (playerMounted) {
      window.addEventListener('playbackStateChange', e => {
        const nextState = this.getPlayState(e.detail.playerState)
        const payload = {
          id: e.detail.stationId,
          playingClass: `show__${nextState}`,
          playerState: e.detail.playerState
        }

        sessionStorage.setItem('currentlyPlaying', JSON.stringify(payload))
        spaCommunicationBridge.sendMessage('ClientWebPlayerPlaybackStatus', payload)
        this.spa.$store.commit(mutationTypes.MODIFY_SPA_PAYLOAD_LOCALS, { currentlyPlaying: payload })
      })

      window.addEventListener('stationIdClick', e => {
        this.redirectToSDP(e.detail.siteSlug, e.detail.id, e.detail.callsign)
      })

      window.addEventListener('goToPodcastPage', e => {
        const { podcastSiteSlug, stationSiteSlug } = e.detail
        this.redirectToPodcast(podcastSiteSlug, stationSiteSlug)
      })

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
  attachClientCommunication () {
    // Add channel that listens for play/pause button clicks.
    if (!spaCommunicationBridge.channelActive('SpaPlayerInterfacePlaybackStatus')) {
      spaCommunicationBridge.subscribe('SpaPlayerInterfacePlaybackStatus', async (payload) => {
        const { stationId, playbackStatus, podcastId, episodeId } = payload

        if (podcastId && episodeId) {
          await this.play(null, podcastId, episodeId)
        } else if (stationId) {
          await this.play(stationId)
        } else {
          await this[playbackStatus]()
        }
      })
    }
    // Add channel that communicates currently loaded station id.
    if (!spaCommunicationBridge.channelActive('SpaPlayerInterfaceGetCurrentStationId')) {
      spaCommunicationBridge.subscribe('SpaPlayerInterfaceGetCurrentStationId', async () => {
        const currentStation = this.getCurrentStation()

        return currentStation.id
      })
    }
  }

  /**
   *
   * Play radio station / podcast episode stream.
   *
   * If playPodcast is passed, player will play podcast
   * If podcastId and episodeId is passed, player will load that episodeId
   * If stationId is passed, player will load that station and then play.
   * Otherwise player will play the station that is currently loaded.
   *
   * IMPORTANT: Autoplay on initial pageload does not always work on Chrome and Firefox.
   * See: https://entercomdigitalservices.atlassian.net/browse/ON-133?focusedCommentId=75260&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-75260
   *
   */
  async play (stationId = null, podcastId = null, episodeId = null) {
    // Verify player is booted first.
    if (!this.playerBooted()) {
      await this.bootPlayer()
    }

    if (podcastId && episodeId) {
      await this.loadEpisode(podcastId, episodeId)
    } else {
      const currentStation = this.getCurrentStation()

      // If stationId wasn't passed in, pull currently playing
      // station from player to set stationId.
      if (!stationId && currentStation) {
        stationId = currentStation.id
      }

      // Set station.
      if (stationId && (!currentStation || currentStation.id !== stationId)) {
        await this.loadStation(stationId)
      }
    }
  }

  /**
   * Redirect to Station Detail Page by using siteSlug, callsign or id
   * @param { string } siteSlug
   * @param { number } id
   * @param { string } callsign
   */
  redirectToSDP (siteSlug, id, callsign) {
    const value = siteSlug || callsign || id
    this.spa.$router.push(`/${value}/listen`)
  }

  /**
   * Redirect to Podcast Page by using podcastSiteSlug
   * Return if the route is the current
   * @param { string } podcastSiteSlug
   * @param { string } stationSiteSlug
   */
  redirectToPodcast (podcastSiteSlug, stationSiteSlug) {
    let route = `/podcasts/${podcastSiteSlug}`

    if (stationSiteSlug) {
      // if the siteSlug is defined make sure to append so they go back
      // to station context
      route = `/${stationSiteSlug}${route}`
    }

    if (window.location.pathname === route) {
      // Short circuit If the route is the same as current
      return
    }

    this.spa.$router.push(route)
  }

  /**
   * Pause radio station stream
   */
  async pause () {
    await this.spa.$store.state.radioPlayer.playerControls.pause()
  }

  /**
   *
   * Get the station that is currently loaded in the player.
   *
   */
  getCurrentStation () {
    try {
      return window.RadioPlayer.getCurrentStationId()
    } catch (e) {
      // the getCurrentStationId method will error out if there is no current station
    }
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
   * Load a episode into the player. Must be called before play().
   *
   * @param {number} podcastId - id of podcast of load.
   * @param {number} episodeId - id of episode of load.
   */
  async loadEpisode (podcastId, episodeId) {
    await this.spa.$store.state.radioPlayer.launchPodcastsOrClips([podcastId], [episodeId])
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

  /**
   *
   * Attempt to get a episode ID from a podcast episode page SPA payload.
   *
   */
  extractPodcastEpisodeIdFromSpaPayload () {
    const episodeDetailData = queryPayload.findComponent(this.spa.$store.state.spaPayload.main, 'podcast-episode-page')

    if (episodeDetailData && episodeDetailData.episode && episodeDetailData.podcast) {
      return { podcastId: episodeDetailData.podcast.id, episodeId: episodeDetailData.episode.id }
    } else {
      return {}
    }
  }
}

export default SpaPlayerInterface
