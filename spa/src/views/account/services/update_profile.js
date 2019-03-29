import axios from 'axios'
import formatError from './format_error'
import { debugLog } from '../utils'

function updateProfile (profileData) {
  const url = '/radium/v1/profile/update'
  const options = {
    method: 'POST',
    data: {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      gender: profileData.gender,
      date_of_birth: profileData.dateOfBirth.toISOString(),
      zip_code: profileData.zipCode
    },
    url
  }
  debugLog('options', options)
  return axios(options)
    .catch((err) => {
      throw formatError(err)
    })
}

export default updateProfile
