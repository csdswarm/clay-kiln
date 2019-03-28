// import jwt from 'jwt-simple';
import store from '../../store'
// import createGuest from 'cross-domain-storage/guest';

export const debugLog = (...args) => {
//todo: remove
  console.log(...args) // eslint-disable-line no-console

  if (process.env.NODE_ENV === 'local') {
    console.log(...args) // eslint-disable-line no-console
  }
}

export const isValidZipCode = zipCode => /^\d{5}(-\d{4})?$/.test(zipCode)

export const getDeviceId = (device) => {
  switch (device) {
    case 'ios':
      return 'iOS Device'
    case 'android':
      return 'Android Device'
    default:
      return navigator.userAgent
  }
}

export const validateEmail = email => /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(email) && email.indexOf(' ') === -1

export const validatePlatform = (platform) => {
  const platformVals = ['webplayer', 'ios', 'android', 'roku', 'firetv']
  return (platform && platformVals.includes(platform))
}

export const setToLocalStore = (authData) => {
  const { metadata } = store.state
  // Promise.resolve(); // switching off the local storage functionality since host is not setup yet

  const xsStorage = createGuest(metadata.app.webplayer.facebookCallbackPortal)
  return new Promise((resolve, reject) => {
    xsStorage.set('auth', authData, (err, storedData) => {
      if (err) {
        return reject(err.message)
      }
      xsStorage.close()
      return resolve(storedData)
    })
  })
}
