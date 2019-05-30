/**
 *
 * SpaStateInterface library contains communications/management logic related to Vue State.
 *
 */

import SpaCommunicationBridge from './SpaCommunicationBridge'

const spaCommunicationBridge = SpaCommunicationBridge()

class SpaStateInterface {
  constructor (spaApp) {
    this.spa = spaApp

    if (!spaCommunicationBridge.channelActive('SpaStateInterfaceState')) {
      spaCommunicationBridge.addChannel('SpaStateInterfaceState',
        (variable) => variable ? this.spa.$store.state[variable] : this.spa.$store.state
      )
    }
  }
}

export default SpaStateInterface
