import axios from "axios";
import * as mutationTypes from "./mutationTypes";
import * as actionTypes from "./actionTypes";
import formatError from "../views/account/services/format_error";
import { getDeviceId } from "../views/account/utils";


const axiosCall = async ({ method, url, data, commit }) => {
  try {
    commit(mutationTypes.ACCOUNT_MODAL_LOADING, true)
    const result = await axios({ method, url, data })

    commit(mutationTypes.ACCOUNT_MODAL_LOADING, false)
    return result
  } catch (err) {
    commit(mutationTypes.ACCOUNT_MODAL_LOADING, false)
    commit(mutationTypes.ERROR_MESSAGE, formatError(err).message)
    throw formatError(err)
  }
}

export default {
  async [actionTypes.GET_METADATA] ({commit, state}) {
    // if this is the first time that the account page had loaded, get the meta data and profile of a user
    if (!state.metadata.app) {
      const result = await axiosCall({ method: 'get', url: '/radium/v1/app/metadata', commit })

      commit(mutationTypes.SET_METADATA, result.data)

      return result
    }
  },
  async [actionTypes.SIGN_IN] ({commit, state}, { email, password }) {
    const result = await axiosCall({ commit, method: 'post', url:'/radium/v1/auth/signin', data: {
        client_id: state.metadata.app.webplayer.clientId,
        email,
        password,
        device_id: getDeviceId()
      }})

    commit(mutationTypes.SET_USER, { ...result.data })
  },
  async [actionTypes.SIGN_UP]  ({ commit, state, dispatch }, { email, password }) {
    await axiosCall({ commit, method: 'post', url: '/radium/v1/auth/signup', data: {
      client_id: state.metadata.app.webplayer.clientId,
      email,
      password
    }})

    await dispatch(actionTypes.SIGN_IN, { email, password })
    commit(mutationTypes.SIGN_UP_COMPLETE)
    commit(mutationTypes.ROUTER_PUSH, '/account/profile')
  },
  async [actionTypes.CREATE_PROFILE]  ({ commit }, user) {
    const result = await axiosCall({ commit, method: 'post', url: '/radium/v1/profile/create', data: {
        first_name: user.firstName,
        last_name: user.lastName,
        gender: user.gender,
        date_of_birth: user.dateOfBirth.toISOString(),
        zip_code: user.zipCode,
        email: user.email
      }
    })

    commit(mutationTypes.SET_USER, { ...result.data })
    commit(mutationTypes.ACCOUNT_MODAL_HIDE)
  }
}
