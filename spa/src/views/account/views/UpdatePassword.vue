<template>
  <div class="update-password">

    <fieldset>
      <h1 align="center">Change Your Password</h1>
      <message></message>
      <input
              :value="currentPassword"
              type="password"
              placeholder="Current Password"
              name="currentPassword"
              @change="onFieldChange($event)"
      >
      <input
              :value="newPassword"
              type="password"
              placeholder="New Password"
              name="newPassword"
              @change="onFieldChange($event)"
      >
      <input
              :value="confirmNewPassword"
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
  </div>
</template>

<script>
import Loader from '../components/Loader'
import Message from '../components/Message'
import * as actionTypes from '@/vuex/actionTypes'
import * as mutationTypes from '@/vuex/mutationTypes'

export default {
  name: 'UpdatePassword',

  components: {
    Loader,
    Message
  },

  computed: {
    hasUserData: (state) => Object.keys(state.user).length
  },

  data () {
    return {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  },

  async created () {
    try {
      await this.$store.dispatch(actionTypes.GET_PROFILE)
    } catch (e) {
      this.$store.commit(mutationTypes.MODAL_ERROR, null)
      this.$router.push({ path: '/account/login' })
    }
  },

  methods: {
    onFieldChange (event) {
      this[event.target.name] = event.target.value
    },

    onUpdatePasswordSubmit () {
      if (!this.currentPassword) {
        this.$store.commit(mutationTypes.MODAL_ERROR, 'Current Password is missing.')
        return
      }

      if (!this.newPassword) {
        this.isError = true
        this.$store.commit(mutationTypes.MODAL_ERROR, 'New Password is missing')
        return
      }

      if (this.newPassword !== this.confirmNewPassword) {
        this.isError = true
        this.$store.commit(mutationTypes.MODAL_ERROR, 'Passwords do not match.')
        return
      }

      this.$store.dispatch(actionTypes.UPDATE_PASSWORD, {
        old_password: this.currentPassword,
        new_password: this.newPassword
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
