<template>
  <div class="forgot-your-password">
    <fieldset>
      <h1 align="center"> Forgot Your Password? </h1>
      <message></message>
      <div class="floating-label">
      <input name="email" type="email" placeholder="Email Address" :value="email" @change="onFieldChange($event)">
      </div>
    </fieldset>
    <input type="submit" value="SUBMIT" @click.prevent="onForgotPasswordSubmit()"/>
    <p align="center">
      <span class="small">
        <router-link to="/account/login">Log In</router-link>
        |
        <router-link to="/account/signup">Create an Account</router-link>

      </span>
    </p>
  </div>
</template>

<script>
import Message from '../components/Message'
import { validateEmail } from '../utils'
import { EMAIL_MISSING, EMAIL_INVALID } from '../constants'
import * as actionTypes from '@/vuex/actionTypes'
import * as mutationTypes from '@/vuex/mutationTypes'

export default {
  name: 'ForgotYourPassword',

  components: {
    Message
  },

  data () {
    return {
      email: ''
    }
  },

  methods: {
    onFieldChange (event) {
      this[event.target.name] = event.target.value
    },
    validateForm () {
      if (!this.email) {
        return EMAIL_MISSING
      }

      if (!validateEmail(this.email)) {
        return EMAIL_INVALID
      }
      return null
    },
    onForgotPasswordSubmit () {
      const error = this.validateForm()

      if (error) {
        this.$store.commit(mutationTypes.MODAL_ERROR, error)
      } else {
        this.$store.dispatch(actionTypes.FORGOT_PASSWORD, this.email)
      }
    }
  }
}
</script>
