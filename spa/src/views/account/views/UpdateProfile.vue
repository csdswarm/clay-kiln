<template>
  <div class="create-profile">
    <fieldset v-if="hasUserData">
      <h1 align="center"> Update Your Profile<span
              class="small"
              style="padding: 0px 10px 0px 10px;"/></h1>
      <message></message>
      <input
              :value="user.first_name"
              type="text"
              placeholder="First Name"
              size="30"
              name="first_name"
              @change="onFieldChange($event)"
      >
      <input
              :value="user.last_name"
              type="text"
              placeholder="Last Name"
              size="30"
              name="last_name"
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
                :value="user.date_of_birth ? user.date_of_birth.format('YYYY-MM-DD') : user.date_of_birth"
                type="date"
                name="date_of_birth"
                class="dateclass placeholderclass dob"
                data-placeholder="Date of Birth"
                required
                aria-required="true"
                @change="onHtml5DateChange($event)"
        >
      </div>
      <div v-else>
        <datepicker
                :value="user.date_of_birth"
                placeholder="Date of Birth"
                format="yyyy-MM-dd"
                @selected="onVueDatepickerChange($event)"
        />
      </div>
      <input
              :value="user.zip_code"
              type="text"
              placeholder="Zip Code"
              name="zip_code"
              @change="onFieldChange($event)"
      >
    </fieldset>
    <div>
      <input
              type="submit"
              value="SAVE"
              @click.prevent="onProfileSubmit()">
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import Datepicker from 'vuejs-datepicker'
import Message from '../components/Message'
import { isMobileDevice, isValidZipCode, debugLog } from '../utils'
import { mapState } from 'vuex'
import * as actionTypes from '@/vuex/actionTypes'
import * as mutationTypes from '@/vuex/mutationTypes'

export default {
  name: 'UpdateProfile',

  components: {
    Datepicker,
    Message
  },

  computed: {
    ...mapState([
      'user'
    ]),
    hasUserData: (state) => Object.keys(state.user).length
  },

  data () {
    return {
      mobile: isMobileDevice(),
      updatedUser: {}
    }
  },

  async created () {
    try {
      await this.$store.dispatch(actionTypes.GET_PROFILE)
      this.updatedUser = { ...this.$store.state.user }
    } catch (e) {
      this.$store.commit(mutationTypes.MODAL_ERROR, null)
      this.$router.push({ path: '/account/login' })
    }
  },

  methods: {
    onFieldChange (event) {
      debugLog('edit user', this.updatedUser)
      this.updatedUser[event.target.name] = event.target.value
    },

    onHtml5DateChange (event) {
      debugLog('html5 date change', event)
      this.updatedUser.date_of_birth = moment(event.target.value, 'YYYY-MM-DD').utc()
    },

    onVueDatepickerChange (dateObj) {
      debugLog('on vuejs datepicker change without time', moment.utc(dateObj).startOf('day').toISOString())
      this.updatedUser.date_of_birth = moment.utc(dateObj).startOf('day')
    },

    validateProfileEntities (userData) {
      if (!userData.gender) {
        return 'Gender is missing.'
      }
      if (!userData.date_of_birth) {
        return 'Date of birth is missing.'
      }
      if (!isValidZipCode(userData.zip_code)) {
        return 'Zip code is not valid.'
      }

      return ''
    },

    onProfileSubmit () {
      const error = this.validateProfileEntities(this.updatedUser)

      if (error) {
        this.$store.commit(mutationTypes.MODAL_ERROR, error)
      } else {
        this.$store.dispatch(actionTypes.UPDATE_PROFILE, this.updatedUser)
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

</style>
