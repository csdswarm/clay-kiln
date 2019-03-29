<template>
  <div class="sign-in">
    <fieldset>
      <h1 class="h1-login" align="center"> <span>Log In</span> <span class="small" style=" padding:0px 10px 0px 10px">or</span>
        <facebook-button :link="facebookLink"/>
      </h1>
      <span
              v-if="user.error"
              class="error"
              align="center">{{ user.error }}</span>
      <input type="email" placeholder="Email Address" name="email" @change="onFieldChange($event)"/>
      <input type="password" placeholder="Password" name="password" @change="onFieldChange($event)"/>
    </fieldset>
    <input type="submit" value="LOG IN" @click.prevent="onLogInSubmit()"/>
    <p align="center">
      <span class="small">
        <router-link :to="
forgotPasswordLink">Forgot Password?</router-link>&nbsp; | &nbsp;<router-link :to="signUpLink">Create an Account</router-link>
      </span>
    </p>
    <div v-if="user.isLoading">
      <loader/>
    </div>
  </div>
</template>

<script>
import FacebookButton from '../components/FacebookButton'
import Loader from '../components/Loader'
import service from '../services/index'
import { validateEmail, getDeviceId } from '../utils'
import * as mutationTypes from '@/vuex/mutationTypes'

export default {
  name: 'Login',

  components: {
    FacebookButton,
    Loader
  },

  computed: {
    facebookLink () {
      const { metadata } = this.$store.state
      const facebookRedirectUri = `${metadata.host}/account/facebook-callback`
      const redirect = { redirect_uri: this.$route.query.redirect_uri }
      return `${metadata.cognito.domain}/authorize?response_type=code&client_id=${metadata.app.webplayer.clientId}&state=${encodeURI(JSON.stringify(redirect))}&redirect_uri=${facebookRedirectUri}&identity_provider=Facebook`
    },

    signUpLink () {
      return this.$route.query.redirect_uri ? `/account/signup?redirect_uri=${this.$route.query.redirect_uri}` : `/account/signup`
    },

    forgotPasswordLink () {
      return this.$route.query.redirect_uri ? `/account/password/forgot?redirect_uri=${this.$route.query.redirect_uri}` : `/account/password/forgot`
    }
  },

  data () {
    return {
      user: {
        error: null,
        email: '',
        password: '',
        isLoading: false
      }
    }
  },

  methods: {
    onFieldChange (event) {
      this.user[event.target.name] = event.target.value
    },

    async onLogInSubmit () {
      this.user.error = null
      if (!this.user.email) {
        this.user.error = 'Email address is missing.'
        return
      }

      if (!validateEmail(this.user.email)) {
        this.user.error = 'Email address is not valid.'
        return
      }

      if (!this.user.password) {
        this.user.error = 'Password is missing.'
        return
      }

      this.user.isLoading = true
      const { metadata } = this.$store.state
      const platform = 'webplayer'

      try {
        const result = await service.signIn(metadata.app.webplayer.clientId, this.user.email, this.user.password, getDeviceId(platform))
        this.$store.commit(mutationTypes.SET_USER, { ...result.data })
        this.$store.commit(mutationTypes.ACCOUNT_MODAL_HIDE)
        this.user.isLoading = false
      } catch (err) {
        this.user.isLoading = false
        this.user.error = err.message
      }
    }
  }
}
</script>

<style>
  .h1-login {
    line-height: 180%
  }

  .sign-in {
    position: relative
  }

  .error{
    text-align:center
  }
</style>
