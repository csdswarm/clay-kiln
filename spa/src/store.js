import Vue from 'vue'
import Vuex from 'vuex'
import { handlebars } from '../config/initHandlebars'
import { Base64 } from 'js-base64'
import mutations from './vuex/mutations'
import actions from './vuex/actions'

Vue.use(Vuex)

// Set store default values.
export const vuexStoreDefaultState = {
  handlebars: null,
  spaPayload: {},
  spaPayloadLocals: {},
  setupRan: false,
  loadingAnimation: false,
  // pageCache is reset/flushed every time the SPA navigates. It is used as storage associated with a single SPA "pageview"
  pageCache: {
    gallerySlidePageviews: {} // Used to track slide pageview events so slide pageviews are only counted once per SPA "pageview"
  },
  metadata: {},
  modalComponent: null,
  user: {},
  modalLoading: true,
  modalMessage: {
    message: null,
    type: null
  },
  routerPush: null
}

export default new Vuex.Store({
  state: vuexStoreDefaultState,
  mutations,
  actions,
  getters: {}
})

/**
 *
 * This configures and sets the initial state of the vuex store before the
 * store is injected into a new Vue SPA instance.
 *
 * Content related data is pulled of of window.spaPayload, which is
 * supplied by the SSR HTML.
 *
 * @param {object} store - A fresh vuex store instance
 */
export function setVuexStoreBaseState (store) {
  let spaPayload = null

  // Load SPA Payload from window.
  if (window.spaPayload) {
    // Decode payload from base64 into JSON and parse for loading into store.
    const jsonPayload = Base64.decode(window.spaPayload)
    spaPayload = JSON.parse(jsonPayload)
  } else {
    throw new Error('SPA Payload failed to load.')
  }

  // Merge configured state with default state to create base state.
  const baseState = Object.assign({}, vuexStoreDefaultState, {
    handlebars,
    spaPayload,
    spaPayloadLocals: JSON.parse(JSON.stringify(spaPayload.locals))
  })

  // Set base state.
  store.replaceState(baseState)
}
