import * as mutationTypes from './mutationTypes'
import vuexStoreDefaultState from '@/store'

export default {
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
  [mutationTypes.SET_METADATA]: (state, metadata) => { state.metadata = metadata },
  [mutationTypes.SET_USER]: (state, user) => { state.user = user },
  [mutationTypes.SET_REDIRECT_URI]: (state, redirectUri) => { state.redirectUri = redirectUri },
  [mutationTypes.SUCCESS_REDIRECT]: (state, platform) => {
    return state.redirectUri && platform !== 'webplayer'
      ? window.open(state.redirectUri, '_self') : this.$router.push({ path: `/account/success` })
  },
  [mutationTypes.SIGN_UP_COMPLETE]: (state) => { state.user = { ...state.user, signUpComplete: true } },
  [mutationTypes.ACCOUNT_MODAL_LOADING]: (state, loading) => { state.modalLoading = loading },
  [mutationTypes.ERROR_MESSAGE]: (state, message) => { state.errorMessage = message }
}
