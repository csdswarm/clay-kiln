import axios from 'axios'
import formatError from './format_error'

function resetPassword (email, password, authCode) {
  return axios.post('/radium/v1/auth/password/reset', {
    email,
    auth_code: authCode,
    password
  })
    .catch((err) => {
      throw formatError(err)
    })
}

export default resetPassword
