<template>
  <div class="update-password">

    <fieldset>
      <h1 align="center">Change Your Password</h1>
      <div v-if="isError !== null">
        <span :class="isError ? 'error' : 'confirmation'" align="center">{{feedback}}</span>
      </div>
      <input
        :value="user.currentPassword"
        type="password"
        placeholder="Current Password"
        name="currentPassword"
        @change="onFieldChange($event)"
      >
      <input
        :value="user.newPassword"
        type="password"
        placeholder="New Password"
        name="newPassword"
        @change="onFieldChange($event)"
      >
      <input
        :value="user.confirmNewPassword"
        type="password"
        placeholder="Confirm New Password"
        name="confirmNewPassword"
        @change="onFieldChange($event)"
      >
    </fieldset>
    <input
      type="submit"
      value="SAVE"
      @click.prevent="onUpdatePasswordSubmit()" >
    <div v-if="user.isLoading">
      <loader/>
    </div>
  </div>
</template>

<script>
import Loader from '@/components/Loader'
import service from '@/services'
import { isAccessTokenValid } from '@/utils'

export default {
  name: 'UpdatePassword',

  components: {
    Loader
  },

  data () {
    return {
      user: {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      },
      isLoading: false,
      isError: null,
      feedback: ''
    }
  },

  created () {
    const tokens = this.$route.query
    if (!isAccessTokenValid(tokens.access_token)) {
      this.isError = true
      this.feedback = 'Something went wrong! Please contact support for help.'
      return
    }

    this.$store.commit('SET_TOKENS', tokens)
  },

  methods: {
    onFieldChange (event) {
      console.log(event.target.name, event.target.value)
      this.user[event.target.name] = event.target.value
    },

    onUpdatePasswordSubmit () {
      this.isLoading = false
      this.isError = null
      this.feedback = ''

      if (!this.user.currentPassword) {
        this.isError = true
        this.feedback = 'Current Password is missing.'
        return
      }

      if (!this.user.newPassword) {
        this.isError = true
        this.feedback = 'New Password is missing'
        return
      }

      if (this.user.newPassword !== this.user.confirmNewPassword) {
        this.isError = true
        this.feedback = 'Passwords do not match.'
        return
      }

      this.isLoading = true
      service.updatePassword(this.user.currentPassword, this.user.newPassword)
        .then(() => {
          this.isLoading = false
          this.isError = false
          this.feedback = 'Password has been updated successfully!'
        })
        .catch((err) => {
          this.isLoading = false
          this.isError = true
          this.feedback = err.message
        })
    }
  }
}
</script>

<style>
  .update-password {
    position: relative;
  }
</style>
