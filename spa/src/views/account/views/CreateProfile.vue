<template>
  <div class="create-profile">
    <fieldset>
      <h1 align="center"> Create Your Profile<span
              class="small"
              style="padding: 0px 10px 0px 10px;"/></h1>
      <message></message>
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
      <input
              :value="user.firstName"
              type="text"
              placeholder="First Name"
              size="30"
              name="firstName"
              @change="onFieldChange($event)"
      >
      <input
              :value="user.lastName"
              type="text"
              placeholder="Last Name"
              size="30"
              name="lastName"
              @change="onFieldChange($event)"
      >
      <div class="gender-box">
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
      <div v-if="mobile">
        <input
                :value="user.dateOfBirth ? user.dateOfBirth.format('YYYY-MM-DD') : user.dateOfBirth"
                type="date"
                name="dateOfBirth"
                class="dateclass placeholderclass dob"
                data-placeholder="Date of Birth"
                required
                aria-required="true"
                @change="onHtml5DateChange($event)"
        >
      </div>
      <div v-else>
        <datepicker
                :value="user.dateOfBirth ? user.dateOfBirth.toDate() : user.dateOfBirth"
                placeholder="Date of Birth"
                format="yyyy-MM-dd"
                @selected="onVueDatepickerChange($event)"
        />
      </div>
      <input
              :value="user.zipCode"
              type="text"
              placeholder="Zip Code"
              name="zipCode"
              @change="onFieldChange($event)"
      >
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
      this.user.dateOfBirth = moment(event.target.value, 'YYYY-MM-DD').utc()
    },

    onVueDatepickerChange (dateObj) {
      debugLog('on vuejs datepicker change without time', moment.utc(dateObj).startOf('day').toISOString())
      this.user.dateOfBirth = moment.utc(dateObj).startOf('day')
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
        try {
          await this.$store.dispatch(actionTypes.CREATE_PROFILE, this.user)
        } catch (err) { }
      }
    }
  }
}
</script>

<style>
  .create-profile {
    position: relative;
  }

  .disabled-ui {
    opacity: 0.5;
  }

  .enabled-ui {
    opacity: 1.0;
  }

  /* Desktop datepicker */
  .vdp-datepicker__calendar .cell.selected {
    background-color: #1f055e !important;
    color:#FAFAFA;
  }
  .vdp-datepicker__calendar .cell:hover {
    border-color: #1f055e !important;
  }

  /* Mobile datepicker */
  .dob {
    opacity: 0.8;
  }

  input[type="date"]::before {
    content: attr(data-placeholder);
    width: 100%;
  }

  /* hide our custom/fake placeholder text when in focus to show the default
   * 'mm/dd/yyyy' value and when valid to show the users' date of birth value.
   */
  input[type="date"]:focus::before,
  input[type="date"]:valid::before { display: none }

  .gender-box {
    margin-bottom: 20px;
  }

  /* Radio buttons */
  .radio-item {
    display: inline-block;
    position: relative;
    padding: 0 6px;
    margin: 10px 0 0;
  }

  .radio-item input[type='radio'] {
    display: none;
  }

  .radio-item label {
    color: #666;
    font-weight: normal;
  }

  .radio-item label:before {
    content: " ";
    display: inline-block;
    position: relative;
    top: 5px;
    margin: 0 5px 0 0;
    width: 20px;
    height: 20px;
    border-radius: 11px;
    border: 2px solid #1f055e;
    background-color: transparent;
  }

  .radio-item input[type=radio]:checked + label:after {
    border-radius: 11px;
    width: 12px;
    height: 12px;
    position: absolute;
    top: 9px;
    left: 10px;
    content: " ";
    display: block;
    background: #1f055e;
  }
  .error {
    text-align: center;
  }
</style>
