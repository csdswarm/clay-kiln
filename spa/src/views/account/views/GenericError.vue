<template>
  <div class="generic-error">
    <fieldset>
      <h3 align="center"> Oops!</h3>
        <h1 align="center">We've encountered an unexpected error.</h1>
    </fieldset>
    <input type="submit" value="GO BACK HOME" @click.prevent="genericErrorGoBack()"/>
    <p align="center">
      <span class="small">
        <a href="mailto:support@radio.com" class="underline-link">Click here</a> to contact support.
      </span>
    </p>
  </div>
</template>

<script>
import { debugLog } from '@/utils'

export default {
  name: 'GenericError',
  methods: {
    genericErrorGoBack () {
      const platform = 'webplayer'

      debugLog('error page state', this.$store.state)

      if (this.$store.state.redirectUri) {
        this.$router.push({ path: `/account/signup?redirect_uri=${this.$store.state.redirectUri}` })
      } else {
        this.$router.push({ path: `/account/signup` })
      }
    }
  }
}
</script>
