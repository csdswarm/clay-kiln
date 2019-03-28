<template>
  <div>Redirecting</div>
</template>

<script>
import service from '@/services'
import { debugLog, setToLocalStore } from '@/utils'
export default {
  name: 'FacebookCallback',
  created () {
    const platform = 'webplayer'
    const { code, error_description } = this.$route.query
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
    if (error_description && error_description.includes(WORKAROUND_EXCEPTION)) {
      window.open(cognitoFacebookUrl, '_self')
      return
    }

    if (error_description) {
      this.$router.push({ path: `/account/error?error_description=${error_description}` })
      return
    }

    // Need to set external redirect uri
    const { redirect_uri } = JSON.parse(redirectState)
    this.$store.commit('SET_REDIRECT_URI', redirect_uri)

    const resolvePlatformFbLogin = async facebookCallbackResult => {
      const tokens = facebookCallbackResult.data
      this.$store.commit('SET_TOKENS', tokens)

      let hasProfile = false
      await service.getProfile()
        .then(() => {
          hasProfile = true
        })
        .catch((e) => {
          hasProfile = false
        })

      if (platform === 'webplayer' && hasProfile) {
        return setToLocalStore(tokens).then(() => this.$store.commit('SUCCESS_REDIRECT', platform))
      } else if (platform === 'android' || platform === 'ios') {
        // ios and android handles profile in their own app
        this.$store.commit('SET_TOKENS', { ...tokens, has_profile: hasProfile })
        this.$store.commit('REDIRECT_WITH_TOKENS', platform)
      } else {
        this.$router.push({ path: `/account/profile` })
      }

      return Promise.resolve(null)
    }

    const fbServicePromise = service.facebookCallback(platform, code)
      .then(resolvePlatformFbLogin)
      .catch(err => {
        debugLog('Could not login to Facebook', err)
        this.$router.push({ path: `/account/error` })
      })
  }
}
</script>
