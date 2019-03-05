/**
 *
 * PlayerInterface library contains bridge/communications logic related to the radio-web-player.
 *
 */

import * as mutationTypes from '../vuex/mutationTypes'

const PlayerInterface = {
  loadPlayer: function loadPlayer () {
    return new Promise((resolve, reject) => {

      // Throw timeout error to handle promise "reject" case if this hangs for whatever reason.
      setTimeout(() => {
        reject(new Error('Player JS bundle timed out during loading.'))
      }, 10000)

      document.addEventListener('web-player/player-loaded', () => {
        // Store reference to the player in Vuex so we can interact with it appropriately in SPA.
        if (window.RadioPlayer) {
          this.$store.commit(mutationTypes.LOAD_RADIO_PLAYER, window.RadioPlayer)
          return resolve(true)
        } else {
          return reject(new Error('window.RadioPlayer failed to load correctly.'))
        }
      })

      const event = new CustomEvent('web-player/load-player')
      document.dispatchEvent(event)
    })
  },
  initializePlayer: function initializePlayer () {

    this.$store.state.radioPlayer.initialize()

  },
  loadStationByIdAndPlay: function loadStationByIdAndPlay (stationId) {
    // NOTE - updateStationList() returns a promise.
    return this.$store.state.radioPlayer.updateStationList([stationId])
  },
  playerPlay: function playerPlay () {
    return this.$store.state.radioPlayer.play()
  },
  playerPause: function playerPause () {
    return this.$store.state.radioPlayer.pause()
  }
}

export default PlayerInterface
