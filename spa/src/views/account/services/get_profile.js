import axios from 'axios'
import formatError from './format_error'
import store from '../../../store'
import { debugLog } from '../utils'

function getProfile () {
  const url = '/radium/v1/profile'
  const options = {
    method: 'GET',
    url
  }
  debugLog('options', options)
  return axios(options)
    .catch((err) => {
      throw formatError(err)
    })
}

export default getProfile
