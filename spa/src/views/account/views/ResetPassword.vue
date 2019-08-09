<template>
  <div class="reset-password">

    <fieldset>
      <h1 align="center">Reset Your Password</h1>
      <message></message>
      <div v-if="showForm">
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
      </div>
    </fieldset>
    <div v-if="showForm">
      <input
        type="submit"
        value="RESET PASSWORD"
        @click.prevent="onResetPasswordSubmit()" >
    </div>
  </div>
</template>

<script>
import Message from '../components/Message'
import * as actionTypes from '@/vuex/actionTypes'
import * as mutationTypes from '@/vuex/mutationTypes'

export default {
  name: 'ResetPassword',

  components: {
    Message
  },
  computed: {
    showForm: function () {
      return this.$store.state.modalMessage.type !== 'success'
    }
  },
  data () {
    return {
      user: {
        password: '',
        confirmPassword: '',
        email: this.$route.query.email,
        authCode: this.$route.query.auth_code
      }
    }
  },

  methods: {
    onFieldChange (event) {
      this.user[event.target.name] = event.target.value
    },

    validateForm () {
      if (!this.user.email || !this.user.authCode) {
        return 'Fields missing on page'
      }

      if (!this.user.password) {
        return 'Password is missing.'
      }

      if (this.user.password !== this.user.confirmPassword) {
        return 'Passwords do not match.'
      }

      return null
    },

    onResetPasswordSubmit () {
      const error = this.validateForm()

      if (error) {
        this.$store.commit(mutationTypes.MODAL_ERROR, error)
      } else {
        this.$store.dispatch(actionTypes.RESET_PASSWORD, {
          email: this.user.email,
          password: this.user.password,
          authCode: this.user.authCode })
      }
    }
  }
}
</script>

<style>
  .reset-password {
    position: relative;
  }
</style>
