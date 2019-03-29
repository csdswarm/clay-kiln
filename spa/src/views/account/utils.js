
export const debugLog = (...args) => {
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

export const validateEmail = email => /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i.test(email) && email.indexOf(' ') === -1

export const validatePlatform = (platform) => {
  const platformVals = ['webplayer', 'ios', 'android', 'roku', 'firetv']
  return (platform && platformVals.includes(platform))
}

export const isMobileDevice = () => /Mobi|Android/i.test(window.navigator.userAgent)
