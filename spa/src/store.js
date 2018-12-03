import Vue from 'vue'
import Vuex from 'vuex'
import * as mutationTypes from './vuex/mutationTypes'

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
