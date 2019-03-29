<template>
  <div>Redirecting</div>
</template>

<script>
import service from '@/services'
import { debugLog, setToLocalStore } from '@/utils'
import { isMobileDevice } from '../utils'
import * as mutationTypes from '@/vuex/mutationTypes'

export default {
  name: 'FacebookCallback',
  created () {
    const platform = 'webplayer'
    const { code } = this.$route.query
    const { errorDescription } = this.$route.query.error_description
    const { metadata } = this.$store.state

    debugLog('facebook callback query', this.$route.query)

    const facebookRedirectUri = `${metadata.host}/account/facebook-callback`

    // Facebook adds '\' character when it redirects back
    const redirectState = this.$route.query.state.replace(/\\/g, '')

    const cognitoFacebookUrl = `${metadata.cognito.domain}/authorize?response_type=code&client_id=${metadata.app.webplayer.clientId}&state=${encodeURI(redirectState)}&redirect_uri=${facebookRedirectUri}&identity_provider=Facebook`

    const WORKAROUND_EXCEPTION = 'Service: AWSCognitoIdentityProviderInternalService; Status Code: 400; Error Code: AliasExistsException;'

    /**
     * See https://forums.aws.amazon.com/thread.jspa?threadID=267154&tstart=0
     * Currently there is a bug in Cognito which returns AliasExistsException when merging a user
     * The workaround for this is to request Facebook link second time, so it would be successful
     */
    if (errorDescription && errorDescription.includes(WORKAROUND_EXCEPTION)) {
      window.open(cognitoFacebookUrl, '_self')
      return
    }

    if (errorDescription) {
      this.$router.push({ path: `/account/error?error_description=${errorDescription}` })
      return
    }

    // Need to set external redirect uri
    const { redirectUri } = JSON.parse(redirectState).redirect_uri
    this.$store.commit(mutationTypes.SET_REDIRECT_URI, redirectUri)

    const resolvePlatformFbLogin = async facebookCallbackResult => {
      const user = facebookCallbackResult.data
      this.$store.commit(mutationTypes.SET_USER, user)

      let hasProfile = false
      await service.getProfile()
        .then(() => {
          hasProfile = true
        })
        .catch((e) => {
          hasProfile = false
        })

      if (platform === 'webplayer' && hasProfile) {
        return setToLocalStore(user).then(() => this.$store.commit('SUCCESS_REDIRECT', platform))
      } else if (isMobileDevice()) {
        // ios and android handles profile in their own app
        this.$store.commit(mutationTypes.SET_USER, { ...user, has_profile: hasProfile })
        this.$store.commit(mutationTypes.SUCCESS_REDIRECT, platform)
      } else {
        this.$router.push({ path: `/account/profile` })
      }

      return Promise.resolve(null)
    }

    service.facebookCallback(platform, code)
      .then(resolvePlatformFbLogin)
      .catch(err => {
        debugLog('Could not login to Facebook', err)
        this.$router.push({ path: `/account/error` })
      })
  }
}
</script>
