import Vue from 'vue'
import Vuex from 'vuex'
import * as mutationTypes from './vuex/mutationTypes'
import { handlebars } from '../config/initHandlebars'
import { Base64 } from 'js-base64'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    handlebars: null,
    spaPayload: {},
    spaPayloadLocals: {},
    setupRan: false
  },
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
    }
  },
  actions: {

  }
})

/**
 *
 * This sets the initial state of the vuex store before the
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

  // Set base state data.
  const baseState = {
    handlebars: handlebars,
    spaPayload: spaPayload,
    spaPayloadLocals: JSON.parse(JSON.stringify(spaPayload.locals)),
    setupRan: false
  }

  store.replaceState(baseState)
}
