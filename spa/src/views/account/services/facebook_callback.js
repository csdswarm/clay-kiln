import axios from 'axios'
import formatError from './format_error'
import { debugLog } from '../utils'

function facebookCallback (platform, code) {
  const url = '/radium/v1/app/facebook_callback'
  const options = {
    method: 'POST',
    data: {
      platform,
      code
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
