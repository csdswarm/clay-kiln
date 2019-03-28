import axios from 'axios'
import formatError from './format_error'

function signUp (clientId, email, password) {
  return axios.post('/radium/v1/auth/signup', {
    client_id: clientId,
    email,
    password
  })
    .catch((err) => {
      throw formatError(err)
    })
}

export default signUp
