/**
 *
 * SpaStateInterface library contains communications/management logic related to Vue State.
 *
 */

import SpaCommunicationBridge from './SpaCommunicationBridge'
import { SET_LOADED_IDS } from '../vuex/mutationTypes'

const spaCommunicationBridge = SpaCommunicationBridge()

class SpaStateInterface {
  constructor (spaApp) {
    this.spa = spaApp

    if (!spaCommunicationBridge.channelActive('SpaStateInterfaceState')) {
      spaCommunicationBridge.subscribe('SpaStateInterfaceState',
        (variable) => variable ? this.spa.$store.state[variable] : this.spa.$store.state
      )
    }

    if (!spaCommunicationBridge.channelActive('SpaStateInterface_UpdateLoadedIds')) {
      spaCommunicationBridge.subscribe('SpaStateInterface_SetLoadedIds',
        (loadedIds) => {
          this.spa.$store.commit(SET_LOADED_IDS, loadedIds)
        }
      )
    }
  }
}

export default SpaStateInterface
