import * as mutationTypes from './mutationTypes'
import vuexStoreDefaultState from '@/store'
import { isMobileDevice } from '../views/account/utils'
import moment from 'moment'

const createModalMessage = (type, message) => { return { type, message } }

/**
 * takes a profile with date_of_birth in UTC and converts it to local, formatting as needed based on device
 *
 * @param {Object} profile
 * @return {Object} profile
 */
const formatProfile = (profile) => {
  const dateFormat = isMobileDevice() ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm:ssZ'
  return {
    ...profile,
    date_of_birth: profile.date_of_birth ? moment.utc(profile.date_of_birth).local(true).format(dateFormat) : '',
    savedTimeStamp: new Date().getTime()
  }
}

export default {
  [mutationTypes.LOAD_HANDLEBARS]: (state, payload) => {
    state.handlebars = payload.handlebars
  },
  [mutationTypes.LOAD_SPA_PAYLOAD]: (state, payload) => {
    state.spaPayload = payload
  },
  [mutationTypes.MODIFY_SPA_PAYLOAD_LOCALS]: (state, payload) => {
    state.spaPayloadLocals = { ...state.spaPayloadLocals, ...payload }
  },
  [mutationTypes.LOAD_SPA_PAYLOAD_LOCALS]: (state, payload) => {
    state.spaPayloadLocals = payload
  },
  [mutationTypes.MODIFY_SPA_PAYLOAD_LOCALS]: (state, payload) => {
    state.spaPayloadLocals = { ...state.spaPayloadLocals, ...payload }
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
  [mutationTypes.LOAD_RADIO_PLAYER]: (state, radioPlayer) => {
    state.radioPlayer = radioPlayer
  },
  [mutationTypes.ACCOUNT_MODAL_SHOW]: (state, component) => {
    state.modalComponent = component
  },
  [mutationTypes.ACCOUNT_MODAL_HIDE]: (state) => {
    state.modalComponent = null
    state.modalMessage = createModalMessage()
  },
  [mutationTypes.SET_METADATA]: (state, metadata) => { state.metadata = metadata },
  [mutationTypes.SET_USER]: (state, user) => { state.user = formatProfile(user) },
  [mutationTypes.SET_REDIRECT_URI]: (state, redirectUri) => { state.redirectUri = redirectUri },
  [mutationTypes.SIGN_UP_COMPLETE]: (state) => { state.user.signUpComplete = true },
  [mutationTypes.ACCOUNT_MODAL_LOADING]: (state, loading) => { state.modalLoading = loading },
  [mutationTypes.MODAL_ERROR]: (state, message) => { state.modalMessage = createModalMessage('error', message) },
  [mutationTypes.MODAL_SUCCESS]: (state, message) => { state.modalMessage = createModalMessage('success', message) },
  [mutationTypes.ROUTER_PUSH]: (state, path) => { state.routerPush = path },
  [mutationTypes.SET_USER_STATIONS]: (state, stations) => {
    state.user = formatProfile({ ...state.user, favoriteStations: stations })
  }
}
