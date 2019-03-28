import axios from 'axios'
import formatError from './format_error'

function signIn (clientId, email, password, deviceId) {
  return axios.post('/radium/v1/auth/signin', {
    client_id: clientId,
    email,
    password,
    device_id: deviceId
  })
    .catch((err) => {
      throw formatError(err)
    })
}

export default signIn
