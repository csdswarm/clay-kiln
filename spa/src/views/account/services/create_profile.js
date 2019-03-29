import axios from 'axios'
import formatError from './format_error'
import { debugLog } from '../utils'

function createProfile (profileData) {
  const url = '/radium/v1/profile/create'
  const options = {
    method: 'POST',
    data: {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      gender: profileData.gender,
      date_of_birth: profileData.dateOfBirth.toISOString(),
      zip_code: profileData.zipCode,
      email: profileData.email
    },
    url
  }
  debugLog('options', options)
  return axios(options)
    .catch((err) => {
      throw formatError(err)
    })
}

export default createProfile
