import Vue from 'vue'
import Vuex from 'vuex'
import * as mutationTypes from './vuex/mutationTypes'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    layout: null,
    spaPayload: {}
  },
  mutations: {
    [mutationTypes.LOAD_INITIAL_SPA_PAYLOAD]: (state, payload) => {
      state.spaPayload = payload
    }
  },
  actions: {

  }
})
