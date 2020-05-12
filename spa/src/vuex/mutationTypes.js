/**
 *
 * List of possible Vuex mutation types.
 *
 * Defining these as constants is a best practice to avoid silent errors (typo in constant will throw undefined error instead of silently failing like a string would).
 *
 */

export const LOAD_SPA_PAYLOAD = 'LOAD_SPA_PAYLOAD'

export const LOAD_HANDLEBARS = 'LOAD_HANDLEBARS'

export const LOAD_SPA_PAYLOAD_LOCALS = 'LOAD_SPA_PAYLOAD_LOCALS'

export const MODIFY_SPA_PAYLOAD_LOCALS = 'MODIFY_SPA_PAYLOAD_LOCALS'

export const ACTIVATE_LOADING_ANIMATION = 'ACTIVATE_LOADING_ANIMATION'

export const RESET_PAGE_CACHE = 'RESET_PAGE_CACHE'

export const TRACK_GALLERY_SLIDE_PAGEVIEW = 'TRACK_GALLERY_SLIDE_PAGEVIEW'

export const LOAD_RADIO_PLAYER = 'LOAD_RADIO_PLAYER'

export const ACCOUNT_MODAL_SHOW = 'ACCOUNT_MODAL_SHOW'
export const ACCOUNT_MODAL_HIDE = 'ACCOUNT_MODAL_HIDE'
export const ACCOUNT_MODAL_LOADING = 'ACCOUNT_MODAL_LOADING'
export const SET_METADATA = 'SET_METADATA'
export const SET_USER = 'SET_USER'
export const SET_REDIRECT_URI = 'SET_REDIRECT_URI'
export const SIGN_UP_COMPLETE = 'SIGN_UP_COMPLETE'
export const MODAL_ERROR = 'MODAL_ERROR'
export const MODAL_SUCCESS = 'MODAL_SUCCESS'
export const ROUTER_PUSH = 'ROUTER_PUSH'

export const SET_USER_STATIONS = 'SET_USER_STATIONS'

export const SET_LOADED_IDS = 'SET_LOADED_IDS'
