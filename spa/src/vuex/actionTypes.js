/**
 *
 * List of possible Vuex action types.
 *
 * Defining these as constants is a best practice to avoid silent errors (typo in constant will throw undefined error instead of silently failing like a string would).
 *
 */

export const GET_METADATA = 'GET_METADATA'
export const SIGN_IN = 'SIGN_IN'
export const SIGN_OUT = 'SIGN_OUT'
export const SIGN_UP = 'SIGN_UP'
export const CREATE_PROFILE = 'CREATE_PROFILE'
export const GET_PROFILE = 'GET_PROFILE'
export const UPDATE_PROFILE = 'UPDATE_PROFILE'
export const UPDATE_PASSWORD = 'UPDATE_PASSWORD'
export const FORGOT_PASSWORD = 'FORGOT_PASSWORD'
export const RESET_PASSWORD = 'RESET_PASSWORD'

export const FAVORITE_STATIONS_ADD = 'FAVORITE_STATIONS_ADD'
export const FAVORITE_STATIONS_REMOVE = 'FAVORITE_STATIONS_REMOVE'
export const FAVORITE_STATIONS_GET = 'FAVORITE_STATIONS_GET'
export const ROUTE_CHANGE = 'ROUTE_CHANGE'