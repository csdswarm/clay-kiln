import axios from 'axios'
import store from '../../../store'
import formatError from './format_error'

function updatePassword (password, newPassword) {
  const url = '/radium/v1/auth/password/update'
  const options = {
    method: 'POST',
    data: {
      old_password: password,
      new_password: newPassword
    }
  }
  return axios(url, options)
    .catch((err) => {
      throw formatError(err)
    })
}

export default updatePassword
