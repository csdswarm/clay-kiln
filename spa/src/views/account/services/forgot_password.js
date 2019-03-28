import axios from 'axios'
import formatError from './format_error'

function forgotPassword (clientId, email) {
  return axios.put('/radium/v1/auth/password/forgot', {
    client_id: clientId,
    email
  })
    .catch((err) => {
      throw formatError(err)
    })
}

export default forgotPassword
