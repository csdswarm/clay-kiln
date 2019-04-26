<template>
  <div class="create-profile">
    <fieldset>
      <h1 align="center"> Create Your Profile<span
        class="small"
        style="padding: 0px 10px 0px 10px;"/></h1>
      <message></message>
      <div class="floating-label">
        <input
          :value="user.email"
          :disabled="user.disableEmailInput"
          type="text"
          placeholder="Email Address"
          size="30"
          name="email"
          :class="user.disableEmailInput ? 'disabled-ui' : 'enabled-ui'"
          @change="onFieldChange($event)"
        >
        <label>Email Address</label>
      </div>
      <div class="floating-label">
        <input
          :value="user.firstName"
          type="text"
          placeholder="First Name"
          size="30"
          name="firstName"
          @change="onFieldChange($event)"
        >
        <label>First Name</label>
      </div>
      <div class="floating-label">
        <input
          :value="user.lastName"
          type="text"
          placeholder="Last Name"
          size="30"
          name="lastName"
          @change="onFieldChange($event)"
        >
        <label>Last Name</label>
      </div>
      <div class="gender-box">
        <label>Gender</label>
        <div class="radio-item">
          <input
            id="radio-1"
            :checked="user.gender === 'M'"
            name="gender"
            value="M"
            type="radio"
            @change="onFieldChange($event)">
          <label
            for="radio-1"
            class="radio-label">Male</label>
        </div>

        <div class="radio-item">
          <input
            id="radio-2"
            :checked="user.gender === 'F'"
            name="gender"
            value="F"
            type="radio"
            @change="onFieldChange($event)">
          <label
            for="radio-2"
            class="radio-label">Female</label>
        </div>

        <div class="radio-item">
          <input
            id="radio-3"
            :checked="user.gender === 'O'"
            name="gender"
            value="O"
            type="radio"
            @change="onFieldChange($event)">
          <label
            for="radio-3"
            class="radio-label">Other</label>
        </div>
      </div>

      <div class="floating-label">
        <div v-if="mobile">
          <div class="input">
            <input
              :value="user.dateOfBirth"
              type="date"
              name="dateOfBirth"
              id="dateOfBirth"
              class="dob"
              style="width: 250px;"
              data-placeholder="Date of Birth"
              required
              aria-required="true"
              @change="onHtml5DateChange($event)"
            >
            <label for="dateOfBirth">Date of Birth</label>
            {{user.dateOfBirth}}
          </div>
        </div>
        <div v-else>
          <datepicker
            :value="user.dateOfBirth"
            placeholder="Date of Birth"
            format="MM-dd-yyyy"
            @selected="onVueDatepickerChange($event)"
          >
            <label slot="afterDateInput">Date of Birth</label>
          </datepicker>
        </div>
      </div>
      <div class="floating-label">
        <input
          :value="user.zipCode"
          type="text"
          placeholder="Zip Code"
          name="zipCode"
          @change="onFieldChange($event)"
        >
        <label>Zip Code</label>
      </div>
    </fieldset>
    <div>
      <input
        type="submit"
        value="FINISH"
        @click.prevent="onProfileSubmit()">
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import Datepicker from 'vuejs-datepicker'
import Message from '../components/Message'
import { debugLog, validateEmail, isValidZipCode, isMobileDevice } from '../utils'
import store from '@/store'
import * as actionTypes from '@/vuex/actionTypes'
import * as mutationTypes from '@/vuex/mutationTypes'

export default {
  name: 'CreateProfile',

  components: {
    Datepicker,
    Message
  },

  data () {
    const defaultData = {
      mobile: isMobileDevice(),
      user: {
        email: '',
        disableEmailInput: false,
        firstName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
        zipCode: ''
      }
    }

    debugLog('current store state', store.state)
    const user = this.prepopulateProfile(store.state)
    debugLog('current user', user)
    return { ...defaultData, user }
  },

  created () {
    debugLog('profile store state', store.state)

    if (!store.state.user.signUpComplete) {
      this.$router.push({ path: '/account/signup' })
    }
  },

  methods: {
    onFieldChange (event) {
      debugLog('edit user', this.user)
      this.user[event.target.name] = event.target.value
    },

    onHtml5DateChange (event) {
      debugLog('html5 date change', event)
      this.user.dateOfBirth = moment(event.target.value).format('MM-DD-YYYY')
    },

    onVueDatepickerChange (dateObj) {
      debugLog('on vuejs datepicker change without time', moment.utc(dateObj).startOf('day').toISOString())
      this.user.dateOfBirth = dateObj
    },

    prepopulateProfile (state) {
      return {
        ...state.user,
        disableEmailInput: !!(state.user.email)
      }
    },

    validateProfileEntities (userData) {
      if (!userData.email) {
        return 'Email address is missing.'
      }

      if (!userData.disableEmailInput && !validateEmail(userData.email)) {
        return 'Email address is not valid.'
      }

      if (!userData.gender) {
        return 'Gender is missing.'
      }
      if (!userData.dateOfBirth) {
        return 'Date of birth is missing.'
      }
      if (!isValidZipCode(userData.zipCode)) {
        return 'Zip code is not valid.'
      }

      return ''
    },

    async onProfileSubmit () {
      const error = this.validateProfileEntities(this.user)

      if (error) {
        this.$store.commit(mutationTypes.MODAL_ERROR, error)
      } else {
        this.$store.dispatch(actionTypes.CREATE_PROFILE, this.user)
      }
    }
  }
}
</script>
