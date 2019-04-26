import axios from 'axios'
import * as mutationTypes from './mutationTypes'
import * as actionTypes from './actionTypes'
import formatError from '../views/account/services/format_error'
import { getDeviceId, isMobileDevice } from '../views/account/utils'
import moment from 'moment'
import {
  FORGOT_PASSWORD_SUCCESS,
  RESET_PASSWORD_SUCCESS,
  UPDATE_PASSWORD_SUCCESS,
  UPDATE_PROFILE_SUCCESS
} from '../views/account/constants'

const axiosCall = async ({ method, url, data, commit }) => {
  try {
    commit(mutationTypes.ACCOUNT_MODAL_LOADING, true)
    const result = await axios({ method, url: `/radium${url}`, data })

    commit(mutationTypes.ACCOUNT_MODAL_LOADING, false)
    return result
  } catch (err) {
    commit(mutationTypes.ACCOUNT_MODAL_LOADING, false)
    commit(mutationTypes.MODAL_ERROR, formatError(err).message)
  }
}

const formatProfile = (profile) => {
  const dateFormat = isMobileDevice() ? 'YYYY-MM-DD' : 'MM-DD-YYYY'

  return {
    ...profile,
    date_of_birth: profile.date_of_birth ? moment.utc(profile.date_of_birth).local().format(dateFormat) : ''
  }
}

export default {
  async [actionTypes.GET_METADATA] ({ commit, state }) {
    // if this is the first time that the account page had loaded, get the meta data and profile of a user
    if (!state.metadata.app) {
      const result = await axiosCall({ method: 'get', url: '/v1/app/metadata', commit })

      commit(mutationTypes.SET_METADATA, result.data)

      return result
    }
  },
  async [actionTypes.SIGN_IN] ({ commit, state }, { email, password }) {
    const result = await axiosCall({ commit,
      method: 'post',
      url: '/v1/auth/signin',
      data: {
        client_id: state.metadata.app.webplayer.clientId,
        email,
        password,
        device_id: getDeviceId()
      } })

    commit(mutationTypes.SET_USER, { ...result.data })
    commit(mutationTypes.ACCOUNT_MODAL_HIDE)
  },
  async [actionTypes.SIGN_OUT] ({ commit }) {
    await axiosCall({ commit,
      method: 'post',
      url: '/v1/auth/signout',
      data: {
        includeDeviceKey: true
      }
    })
    commit(mutationTypes.SET_USER, { })
  },
  async [actionTypes.SIGN_UP] ({ commit, state, dispatch }, { email, password }) {
    await axiosCall({ commit,
      method: 'post',
      url: '/v1/auth/signup',
      data: {
        client_id: state.metadata.app.webplayer.clientId,
        email,
        password
      } })

    await dispatch(actionTypes.SIGN_IN, { email, password })
    commit(mutationTypes.SIGN_UP_COMPLETE)
    commit(mutationTypes.ROUTER_PUSH, '/account/profile')
  },
  async [actionTypes.CREATE_PROFILE] ({ commit }, user) {
    const result = await axiosCall({ commit,
      method: 'post',
      url: '/v1/profile/create',
      data: {
        first_name: user.firstName,
        last_name: user.lastName,
        gender: user.gender,
        date_of_birth: moment(user.dateOfBirth, 'MM-DD-YYYY').toISOString(),
        zip_code: user.zipCode,
        email: user.email
      }
    })

    commit(mutationTypes.SET_USER, formatProfile(result.data))
    commit(mutationTypes.ACCOUNT_MODAL_HIDE)
  },
  async [actionTypes.GET_PROFILE] ({ commit }) {
    const result = await axiosCall({ commit,
      method: 'get',
      url: '/v1/profile'
    })

    commit(mutationTypes.SET_USER, formatProfile(result.data))
  },
  async [actionTypes.UPDATE_PROFILE] ({ commit }, user) {
    const result = await axiosCall({ commit,
      method: 'post',
      url: '/v1/profile/update',
      data: {
        first_name: user.first_name,
        last_name: user.last_name,
        gender: user.gender,
        date_of_birth: moment(user.date_of_birth).toISOString(),
        zip_code: user.zip_code
      }
    })

    commit(mutationTypes.SET_USER, formatProfile(result.data))
    commit(mutationTypes.MODAL_SUCCESS, UPDATE_PROFILE_SUCCESS)
  },
  async [actionTypes.UPDATE_PASSWORD] ({ commit }, passwords) {
    await axiosCall({ commit,
      method: 'post',
      url: '/v1/auth/password/update',
      data: passwords
    })

    commit(mutationTypes.MODAL_SUCCESS, UPDATE_PASSWORD_SUCCESS)
  },
  async [actionTypes.FORGOT_PASSWORD] ({ commit, state }, email) {
    await axiosCall({ commit,
      method: 'put',
      url: '/v1/auth/password/forgot',
      data: {
        email
      }
    })

    commit(mutationTypes.MODAL_SUCCESS, FORGOT_PASSWORD_SUCCESS)
  },
  async [actionTypes.RESET_PASSWORD] ({ commit, state }, { email, authCode, password }) {
    await axiosCall({ commit,
      method: 'post',
      url: '/v1/auth/password/reset',
      data: {
        email,
        auth_code: authCode,
        password
      }
    })

    commit(mutationTypes.MODAL_SUCCESS, RESET_PASSWORD_SUCCESS)
  }
}
