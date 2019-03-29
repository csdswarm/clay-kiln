<template>
  <div class="sign-up">
    <fieldset>
      <h1 class="h1-signup" align="center">Sign Up
        <span
                class="small"
                style="padding:0px 10px 0px 10px;">or</span>
        <facebook-button :link="facebookLink"/>
      </h1>
      <span
              v-if="user.error"
              class="error"
              align="center">{{ user.error }}</span>
      <input
              :value="user.email"
              type="email"
              placeholder="Email Address"
              name="email"
              autofocus
              @change="onFieldChange($event)"
      >
      <input
              :value="user.password"
              type="password"
              placeholder="Password"
              name="password"
              @change="onFieldChange($event)"
      >
      <input
              :value="user.confirmPassword"
              type="password"
              placeholder="Confirm Password"
              name="confirmPassword"
              @change="onFieldChange($event)"
      >
    </fieldset>
    <span class="terms">
      <span>By proceeding, you agree to the </span>
      <a :href="termOfUse" target="_blank"><u>Terms of Use</u></a>
      <span> and </span>
      <a :href="privacyPolicy" target="_blank"><u>Privacy Policy</u></a>
    </span>
    <input
            type="submit"
            value="SUBMIT"
            @click.prevent="onSignUpSubmit()" >
    <p align="center">
      <span>Already a member?</span>
      <span
              class="small"
              style="padding-left: 4px">
        <router-link :to="loginLink">Log In</router-link>
      </span>
    </p>
    <div v-if="user.isLoading">
      <loader/>
    </div>
  </div>
</template>

<script>
import { validateEmail, getDeviceId } from '../utils'
import FacebookButton from '../components/FacebookButton'
import Loader from '../components/Loader'
import { TERM_OF_USE, PRIVACY_POLICY } from '../constants'
import service from '../services'
import * as mutationTypes from '@/vuex/mutationTypes'

export default {
  name: 'SignUp',

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

    loginLink () {
      return this.$route.query.redirect_uri ? `/account/login?redirect_uri=${this.$route.query.redirect_uri}` : `/account/login`
    },

    termOfUse () {
      return TERM_OF_USE
    },

    privacyPolicy () {
      return PRIVACY_POLICY
    }
  },

  data () {
    return {
      user: {
        error: null,
        email: '',
        password: '',
        confirmPassword: '',
        isLoading: false
      }
    }
  },

  methods: {
    onFieldChange (event) {
      this.user[event.target.name] = event.target.value
    },

    onSignUpSubmit () {
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

      if (this.user.password !== this.user.confirmPassword) {
        this.user.error = 'Passwords do not match.'
        return
      }

      this.user.isLoading = true
      const { metadata } = this.$store.state
      const platform = 'webplayer'
      service.signUp(metadata.app.webplayer.clientId, this.user.email, this.user.password)
        .then(() => service.signIn(metadata.app.webplayer.clientId, this.user.email, this.user.password, getDeviceId(platform)))
        .then((result) => {
          this.$store.commit(mutationTypes.SET_USER, { ...result.data, cameFromCreate: true })
          this.user.isLoading = false
          this.$router.push({ path: `/account/profile` })
        })
        .catch((err) => {
          this.user.isLoading = false
          this.user.error = err.message
        })
    }
  }
}
</script>

<style>
  .h1-signup {
    line-height: 180%;
  }

  .sign-up {
    position: relative;
  }
  .terms{
    text-align:center;
  }
</style>
