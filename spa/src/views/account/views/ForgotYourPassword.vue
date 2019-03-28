<template>
  <div class="forgot-your-password">
    <fieldset>
      <h1 align="center"> Forgot Your Password? </h1>
      <div v-if="isError !== null">
        <span :class="isError ? 'error' : 'confirmation'" align="center">{{feedback}}</span>
      </div>
      <input type="email" placeholder="Email Address" :value="email" @change="getChangedEmail($event)">
    </fieldset>
    <input type="submit" value="SUBMIT" @click.prevent="onForgotPasswordSubmit()"/>
    <p align="center">
      <span class="small">
        <a :href="logInLink">Log In</a>&nbsp; | &nbsp;<a :href="signUpLink">Create an Account</a>
      </span>
    </p>
    <div v-if="isLoading">
      <loader/>
    </div>
  </div>
</template>

<script>
import Loader from '@/components/Loader'
import { validateEmail } from '@/utils'
import { EMAIL_MISSING, EMAIL_INVALID, FORGOT_PASSWORD_SUCCESS } from '@/constants'
import service from '@/services'
export default {
  name: 'ForgotYourPassword',

  components: {
    Loader
  },

  computed: {
    signUpLink () {
      const platform = 'webplayer'
      return this.$route.query.redirect_uri ? `/account/signup?redirect_uri=${this.$route.query.redirect_uri}` : `/account/signup`
    },

    logInLink () {
      const platform = 'webplayer'
      return this.$route.query.redirect_uri ? `/account/login?redirect_uri=${this.$route.query.redirect_uri}` : `/account/login`
    }
  },

  methods: {
    getChangedEmail (event) {
      this.email = event.target.value
    },

    onForgotPasswordSubmit () {
      this.isError = null

      if (!this.email) {
        this.feedback = EMAIL_MISSING
        this.isError = true
        return
      }

      if (!validateEmail(this.email)) {
        this.feedback = EMAIL_INVALID
        this.isError = true
        return
      }

      this.isLoading = true
      const { metadata } = this.$store.state
      const platform = 'webplayer'
      service.forgotPassword(metadata.app.webplayer.clientId, this.email)
        .then(() => {
          this.isError = false
          this.isLoading = false
          this.feedback = FORGOT_PASSWORD_SUCCESS
        })
        .catch((err) => {
          this.isError = true
          this.isLoading = false
          this.feedback = err.message
        })
    }
  },

  data () {
    return {
      email: '',
      feedback: '',
      isError: null,
      isLoading: false
    }
  }
}
</script>

<style>
  .forgot-your-password {
    position: relative;
  }
</style>
