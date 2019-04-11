<template>
  <div class="sign-in">
    <fieldset>
      <h1 class="h1-login" align="center"> <span>Log In</span> <span class="small" style=" padding:0px 10px 0px 10px">or</span>
        <facebook-button :link="facebookLink"/>
      </h1>
      <message></message>
      <input type="email" placeholder="Email Address" name="email" @change="onFieldChange($event)"/>
      <input type="password" placeholder="Password" name="password" @change="onFieldChange($event)"/>
    </fieldset>
    <input type="submit" value="LOG IN" @click.prevent="onLogInSubmit()"/>
    <p align="center">
      <span class="small">
        <router-link to="/account/password/forgot">Forgot Password?</router-link>
        |
        <router-link to="/account/signup">Create an Account</router-link>
      </span>
    </p>
  </div>
</template>

<script>
import FacebookButton from '../components/FacebookButton'
import Message from '../components/Message'
import { validateEmail } from '../utils'
import * as actionTypes from '@/vuex/actionTypes'
import * as mutationTypes from '@/vuex/mutationTypes'

export default {
  name: 'Login',

  components: {
    FacebookButton,
    Message
  },

  computed: {
    facebookLink () {
      const { metadata } = this.$store.state
      const facebookRedirectUri = `${metadata.host}/account/facebook-callback`
      const redirect = { redirect_uri: this.$route.query.redirect_uri }
      return `${metadata.cognito.domain}/authorize?response_type=code&client_id=${metadata.app.webplayer.clientId}&state=${encodeURI(JSON.stringify(redirect))}&redirect_uri=${facebookRedirectUri}&identity_provider=Facebook`
    }
  },

  data () {
    return {
      user: {
        email: '',
        password: ''
      }
    }
  },

  methods: {
    onFieldChange (event) {
      this.user[event.target.name] = event.target.value
    },

    async onLogInSubmit () {
      this.$store.commit(mutationTypes.MODAL_ERROR, null)
      if (!this.user.email) {
        this.$store.commit(mutationTypes.MODAL_ERROR, 'Email address is missing.')
        return
      }

      if (!validateEmail(this.user.email)) {
        this.$store.commit(mutationTypes.MODAL_ERROR, 'Email address is not valid.')
        return
      }

      if (!this.user.password) {
        this.$store.commit(mutationTypes.MODAL_ERROR, 'Password is missing.')
        return
      }

      try {
        await this.$store.dispatch(actionTypes.SIGN_IN, { email: this.user.email, password: this.user.password })
        this.$store.commit(mutationTypes.ACCOUNT_MODAL_HIDE)
      } catch (e) {
        // error handled inside of dispatch
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
