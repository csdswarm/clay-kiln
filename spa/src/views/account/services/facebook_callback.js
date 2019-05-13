import axios from 'axios'
import formatError from './format_error'
import { debugLog } from '../utils'

function facebookCallback (platform, code, redirectUri) {
  const url = '/radium/facebook_callback'
  const options = {
    method: 'POST',
    data: {
      platform,
      code,
      redirectUri
    },
    url
  }
  debugLog('options', options)
  return axios(options)
    .catch((err) => {
      throw formatError(err)
    })
}

export default facebookCallback
