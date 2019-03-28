import Vue from 'vue'
import Vuex from 'vuex'
import * as mutationTypes from './vuex/mutationTypes'
import { handlebars } from '../config/initHandlebars'
import { Base64 } from 'js-base64'

Vue.use(Vuex)

// Set store default values.
const vuexStoreDefaultState = {
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
  accountComponent: null
}

export default new Vuex.Store({
  state: vuexStoreDefaultState,
  mutations: {
    [mutationTypes.LOAD_HANDLEBARS]: (state, payload) => {
      state.handlebars = payload.handlebars
    },
    [mutationTypes.LOAD_SPA_PAYLOAD]: (state, payload) => {
      state.spaPayload = payload
    },
    [mutationTypes.LOAD_SPA_PAYLOAD_LOCALS]: (state, payload) => {
      state.spaPayloadLocals = payload
    },
    [mutationTypes.FLAG_SETUP_RAN]: (state, setupRan) => {
      state.setupRan = setupRan
    },
    [mutationTypes.ACTIVATE_LOADING_ANIMATION]: (state, activate) => {
      state.loadingAnimation = activate
    },
    [mutationTypes.RESET_PAGE_CACHE]: (state) => {
      state.pageCache = Object.assign({}, vuexStoreDefaultState.pageCache)
    },
    [mutationTypes.TRACK_GALLERY_SLIDE_PAGEVIEW]: (state, slideId) => {
      // Update gallerySlidePageviews to track the new slide pageview.
      const gallerySlidePageviews = Object.assign({}, state.pageCache.gallerySlidePageviews, { [slideId]: true })

      // Recreate pageCache with new state.
      state.pageCache = Object.assign(
        {},
        state.pageCache,
        { gallerySlidePageviews }
      )
    },
    [mutationTypes.ACCOUNT_MODAL_SHOW]: (state, component) => {
      state.accountComponent = component
    },
    [mutationTypes.ACCOUNT_MODAL_HIDE]: (state) => {
      state.accountComponent = null
    },
    SET_METADATA: (state, metadata) => { state.metadata = metadata },
    SET_TOKENS: (state, tokens) => { state.tokens = tokens },
    SET_REDIRECT_URI: (state, redirectUri) => { state.redirectUri = redirectUri },
    SUCCESS_REDIRECT: (state, platform) => {
      return state.redirectUri && platform !== 'webplayer'
        ? window.open(state.redirectUri, '_self') : router.push({ path: `/account/success` })
    },
    REDIRECT_WITH_TOKENS: (state, platform) => {
      debugLog('REDIRECT_WITH_TOKENS current state', state)

      if (!state.redirectUri) {
        return router.push({ path: `/account/error` })
      }

      const externalRedirectUri = new URL(state.redirectUri)
      externalRedirectUri.search = new URLSearchParams({ authData: JSON.stringify(state.tokens) })

      return window.open(externalRedirectUri.toString(), '_self')
    }
  },
  actions: {},
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
