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
              v-if="errorMessage"
              class="error"
              align="center">{{ errorMessage }}</span>
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
        <router-link to="/account/login">Log In</router-link>
      </span>
    </p>
  </div>
</template>

<script>
import { validateEmail } from '../utils'
import FacebookButton from '../components/FacebookButton'
import { TERM_OF_USE, PRIVACY_POLICY } from '../constants'
import { mapState } from 'vuex'
import * as actionTypes from '@/vuex/actionTypes'
import * as mutationTypes from '@/vuex/mutationTypes'

export default {
  name: 'SignUp',

  components: {
    FacebookButton
  },

  computed: {
    ...mapState([
      'errorMessage'
    ]),
    facebookLink () {
      const { metadata } = this.$store.state
      const facebookRedirectUri = `${metadata.host}/account/facebook-callback`
      const redirect = { redirect_uri: this.$route.query.redirect_uri }
      return `${metadata.cognito.domain}/authorize?response_type=code&client_id=${metadata.app.webplayer.clientId}&state=${encodeURI(JSON.stringify(redirect))}&redirect_uri=${facebookRedirectUri}&identity_provider=Facebook`
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
        email: '',
        password: '',
        confirmPassword: ''
      }
    }
  },

  methods: {
    onFieldChange (event) {
      this.user[event.target.name] = event.target.value
    },

    async onSignUpSubmit () {
      this.$store.commit(mutationTypes.ERROR_MESSAGE, null)

      if (!this.user.email) {
        this.$store.commit(mutationTypes.ERROR_MESSAGE, 'Email address is missing.')
        return
      }

      if (!validateEmail(this.user.email)) {
        this.$store.commit(mutationTypes.ERROR_MESSAGE, 'Email address is not valid.')
        return
      }

      if (!this.user.password) {
        this.$store.commit(mutationTypes.ERROR_MESSAGE, 'Password is missing.')
        return
      }

      if (this.user.password !== this.user.confirmPassword) {
        this.$store.commit(mutationTypes.ERROR_MESSAGE, 'Passwords do not match.')
        return
      }

      try {
        await this.$store.dispatch(actionTypes.SIGN_UP, { email: this.user.email, password: this.user.password })
        // when switching to the action, pushing to the router causes a conflict to the re-render
        setTimeout(() => { this.$router.push({ path: `/account/profile` })}, 10)
      } catch(err) { }
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
