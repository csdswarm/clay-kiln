<template>
  <img
    class="facebook-button"
    src="../../../assets/login-fb.png"
    width="210"
    height="40"
    @click.prevent="onClick"
  >
</template>

<script>
export default {
  name: 'FacebookButton',

  computed: {
    link () {
      const { metadata } = this.$store.state
      const facebookRedirectUri = `${window.location.origin}/account/facebook-callback`;
      const redirect = { redirect_uri: this.$route.query.redirect_uri }
      return `${metadata.cognito.domain}/authorize?response_type=code&client_id=${metadata.app.webplayer.clientId}&state=${encodeURI(JSON.stringify(redirect))}&redirect_uri=${facebookRedirectUri}&identity_provider=Facebook`
    }
  },

  methods: {
    onClick () {
      const win = window.open(this.link, '_blank')
      win.onbeforeunload = () => {
        this.$emit('loggedin');
      }
    }
  }
}
</script>
