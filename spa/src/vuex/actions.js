import axios from 'axios'
import * as mutationTypes from './mutationTypes'
import * as actionTypes from './actionTypes'
import { getDeviceId } from '../views/account/utils'
import {
  FORGOT_PASSWORD_SUCCESS,
  RESET_PASSWORD_SUCCESS,
  UPDATE_PASSWORD_SUCCESS,
  UPDATE_PROFILE_SUCCESS
} from '../views/account/constants'

const formatError = (err) => {
  if (err.response) {
    const { errors } = err.response.data
    return new Error(errors[0].detail)
  }

  return new Error('An unknown error occurred!')
}

const axiosCall = async ({ method, url, data, commit }, ignoreError) => {
  try {
    commit(mutationTypes.ACCOUNT_MODAL_LOADING, true)
    const result = await axios({ method, url: `/radium${url}`, data })

    commit(mutationTypes.ACCOUNT_MODAL_LOADING, false)
    return result
  } catch (err) {
    commit(mutationTypes.ACCOUNT_MODAL_LOADING, false)

    if (!ignoreError) {
      commit(mutationTypes.MODAL_ERROR, formatError(err).message)
    }
  }
}

/**
 * takes a local user and converts the date_of_birth to a UTC string to be saved on the server
 * @param {Object} profile
 * @return {Object} profile
 */
const formatProfile = (profile) => {
  return {
    ...profile,
    date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth).toISOString() : ''
  }
}

export default {
  async [actionTypes.GET_METADATA] ({ commit, state }) {
    // if this is the first time that the account page had loaded, get the meta data and profile of a user
    if (!state.metadata.app) {
      const result = await axiosCall({ method: 'get', url: '/v1/app/metadata', commit })

      if (result) {
        commit(mutationTypes.SET_METADATA, result.data)
      }

      return result
    }
  },
  async [actionTypes.SIGN_IN] ({ commit, state }, { email, password, hideModal = true }) {
    const result = await axiosCall({ commit,
      method: 'post',
      url: '/v1/auth/signin',
      data: {
        client_id: state.metadata.app.webplayer.clientId,
        email,
        password,
        device_id: getDeviceId()
      } })

    if (result) {
      commit(mutationTypes.SET_USER, { ...result.data })

      if (hideModal) {
        commit(mutationTypes.ACCOUNT_MODAL_HIDE)
      }
    }
  },
  async [actionTypes.SIGN_OUT] ({ commit }) {
    await axiosCall({ commit,
      method: 'post',
      url: '/v1/auth/signout',
      data: {
        includeDeviceKey: true
      }
    })

    commit(mutationTypes.SET_USER, {})
  },
  async [actionTypes.SIGN_UP] ({ commit, state, dispatch }, { email, password }) {
    const result = await axiosCall({ commit,
      method: 'post',
      url: '/v1/auth/signup',
      data: {
        client_id: state.metadata.app.webplayer.clientId,
        email,
        password
      } })

    if (result) {
      // For the sign up process, we want to keep the modal open so
      // that the create profile modal can be displayed without any issues
      await dispatch(actionTypes.SIGN_IN, { email, password, hideModal: false })
      commit(mutationTypes.SIGN_UP_COMPLETE)
      commit(mutationTypes.ROUTER_PUSH, '/account/profile')
    }
  },
  async [actionTypes.CREATE_PROFILE] ({ commit }, user) {
    const result = await axiosCall({ commit,
      method: 'post',
      url: '/v1/profile/create',
      data: formatProfile({
        first_name: user.firstName,
        last_name: user.lastName,
        gender: user.gender,
        date_of_birth: user.dateOfBirth,
        zip_code: user.zipCode,
        email: user.email
      })
    })

    if (result) {
      commit(mutationTypes.SET_USER, result.data)
      commit(mutationTypes.ACCOUNT_MODAL_HIDE)
    }
  },
  async [actionTypes.GET_PROFILE] ({ commit }, ignoreError = false) {
    const result = await axiosCall({ commit,
      method: 'get',
      url: '/v1/profile'
    }, ignoreError)

    commit(mutationTypes.SET_USER, result ? result.data : {})
  },
  async [actionTypes.UPDATE_PROFILE] ({ commit }, user) {
    const result = await axiosCall({ commit,
      method: 'post',
      url: '/v1/profile/update',
      data: formatProfile({
        first_name: user.first_name,
        last_name: user.last_name,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        zip_code: user.zip_code
      })
    })

    if (result) {
      commit(mutationTypes.SET_USER, result.data)
      commit(mutationTypes.MODAL_SUCCESS, UPDATE_PROFILE_SUCCESS)
    }
  },
  async [actionTypes.UPDATE_PASSWORD] ({ commit }, passwords) {
    const result = await axiosCall({ commit,
      method: 'post',
      url: '/v1/auth/password/update',
      data: passwords
    })

    if (result) {
      commit(mutationTypes.MODAL_SUCCESS, UPDATE_PASSWORD_SUCCESS)
    }
  },
  async [actionTypes.FORGOT_PASSWORD] ({ commit, state }, email) {
    const result = await axiosCall({ commit,
      method: 'put',
      url: '/v1/auth/password/forgot',
      data: {
        client_id: state.metadata.app.webplayer.clientId,
        email
      }
    })

    if (result) {
      commit(mutationTypes.MODAL_SUCCESS, FORGOT_PASSWORD_SUCCESS)
    }
  },
  async [actionTypes.RESET_PASSWORD] ({ commit, dispatch }, { email, authCode, password }) {
    const result = await axiosCall({ commit,
      method: 'post',
      url: '/v1/auth/password/reset',
      data: {
        email,
        auth_code: authCode,
        password
      }
    })

    if (result) {
      dispatch(actionTypes.SIGN_IN, { email, password })
      commit(mutationTypes.MODAL_SUCCESS, RESET_PASSWORD_SUCCESS)
    }
  },
  async [actionTypes.FAVORITE_STATIONS_ADD] ({ commit }, stationId) {
    const result = await axiosCall({ commit,
      method: 'patch',
      url: '/v1/favorites/stations/add',
      data: {
        station_id: parseInt(stationId)
      }
    })

    if (result) {
      commit(mutationTypes.SET_USER_STATIONS, result.data.station_ids)
    }
  },
  async [actionTypes.FAVORITE_STATIONS_REMOVE] ({ commit }, stationId) {
    const result = await axiosCall({ commit,
      method: 'patch',
      url: '/v1/favorites/stations/remove',
      data: {
        station_id: parseInt(stationId)
      }
    })

    if (result) {
      commit(mutationTypes.SET_USER_STATIONS, result.data.station_ids)
    }
  },
  async [actionTypes.FAVORITE_STATIONS_GET] ({ commit }) {
    const result = await axiosCall({
      commit,
      method: 'GET',
      url: '/v1/favorites/stations'
    }, true)

    if (result) {
      commit(mutationTypes.SET_USER_STATIONS, result.data.station_ids)
    }
  },
  async [actionTypes.ROUTE_CHANGE] ({ commit, dispatch, state }, route) {
    const favoritesExpiredTime = 1000 * 60 * 5
    const isStationRoute = () => route.path.includes('/stations') || route.path.includes('/listen')
    const favoritesExpired = () => new Date().getTime() - state.user.savedTimeStamp > favoritesExpiredTime

    // Start loading animation.
    commit(mutationTypes.ACTIVATE_LOADING_ANIMATION, true)

    if (isStationRoute() && favoritesExpired()) {
      await dispatch(actionTypes.FAVORITE_STATIONS_GET)
    }
  }
}
