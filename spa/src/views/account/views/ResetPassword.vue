<template>
  <div class="reset-password">

    <fieldset>
      <h1 align="center">Reset Your Password</h1>
      <span
        v-if="user.error"
        class="error"
        align="center">{{ user.error }}</span>
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
    <input
      type="submit"
      value="RESET PASSWORD"
      @click.prevent="onResetPasswordSubmit()" >
    <div v-if="user.isLoading">
      <loader/>
    </div>
  </div>
</template>

<script>
import Loader from '@/components/Loader'
import service from '@/services'

export default {
  name: 'ResetPassword',

  components: {
    Loader
  },

  data () {
    return {
      user: {
        error: null,
        password: '',
        confirmPassword: '',
        isLoading: false,
        email: this.$route.query.email,
        authCode: this.$route.query.auth_code
      }
    }
  },

  methods: {
    onFieldChange (event) {
      this.user[event.target.name] = event.target.value
    },

    onResetPasswordSubmit () {
      this.user.error = null
      if (!this.user.email || !this.user.authCode) {
        this.user.error = 'Fields missing on page'
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
      service.resetPassword(this.user.email, this.user.password, this.user.authCode)
        .then(() => {
          this.$router.push({ path: '/app/reset-password/success' })
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
  .reset-password {
    position: relative;
  }
</style>
