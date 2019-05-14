<template>
  <div class="sign-in">
    <fieldset>
      <h1 class="h1-login" align="center"> <span>Log In</span> <span class="small" style=" padding:0px 10px 0px 10px">or</span>
        <facebook-button @loggedin="closeModal"/>
      </h1>
      <message></message>
      <div class="floating-label">
        <input type="email" placeholder="Email Address" name="email" @change="onFieldChange($event)"/>
        <label>Email Address</label>
      </div>
      <div class="floating-label">
        <input type="password" placeholder="Password" name="password" @change="onFieldChange($event)"/>
        <label>Password</label>
      </div>
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
    closeModal () {
      this.$store.commit(mutationTypes.ACCOUNT_MODAL_HIDE)
    },
    validateForm () {
      if (!this.user.email) {
        return 'Email address is missing.'
      }

      if (!validateEmail(this.user.email)) {
        return 'Email address is not valid.'
      }

      if (!this.user.password) {
        return 'Password is missing.'
      }
    },
    async onLogInSubmit () {
      this.$store.commit(mutationTypes.MODAL_ERROR, null)

      const error = this.validateForm()

      if (error) {
        this.$store.commit(mutationTypes.MODAL_ERROR, error)
      } else {
        try {
          await this.$store.dispatch(actionTypes.SIGN_IN, { email: this.user.email, password: this.user.password })
          this.$store.commit(mutationTypes.ACCOUNT_MODAL_HIDE)
        } catch (e) {
          // error handled inside of dispatch
        }
      }
    }
  }
}
</script>
