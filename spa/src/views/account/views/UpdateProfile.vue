<template>
  <div class="create-profile">
    <fieldset v-if="hasUserData">
      <h1 align="center"> Update Your Profile<span
        class="small"
        style="padding: 0px 10px 0px 10px;"/></h1>
      <message></message>
      <div class="floating-label">
        <input
          :value="user.first_name"
          type="text"
          placeholder="First Name"
          size="30"
          name="first_name"
          id="first_name"
          @change="onFieldChange($event)"
        >
        <label for="first_name">First Name</label>
      </div>
      <div class="floating-label">
        <input
          :value="user.last_name"
          type="text"
          placeholder="Last Name"
          size="30"
          name="last_name"
          id="last_name"
          @change="onFieldChange($event)"
        >
        <label for="last_name">Last Name</label>
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
              :value="user.date_of_birth"
              type="date"
              name="date_of_birth"
              id="date_of_birth"
              class="dob"
              style="width: 250px;"
              data-placeholder="Date of Birth"
              required
              aria-required="true"
              @change="onHtml5DateChange($event)"
            >
            <label for="date_of_birth">Date of Birth</label>
            {{updatedUser.date_of_birth}}
          </div>
        </div>
        <div v-else>
          <datepicker
            :value="user.date_of_birth"
            placeholder="Date of Birth"
            format="MM-dd-yyyy"
            @selected="onVueDatepickerChange($event)"
            id="date_of_birth"
          >
            <label slot="afterDateInput" for="date_of_birth">Date of Birth</label>
          </datepicker>
        </div>
      </div>

      <div class="floating-label">
        <input
          :value="user.zip_code"
          type="text"
          placeholder="Zip Code"
          name="zip_code"
          id="zip_code"
          @change="onFieldChange($event)"
        >
        <label for="zip_code">Zip Code</label>
      </div>
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
      this.updatedUser.date_of_birth = event.target.value
    },

    onVueDatepickerChange (dateObj) {
      this.updatedUser.date_of_birth = dateObj
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
console.log(this.updatedUser)
      if (error) {
        this.$store.commit(mutationTypes.MODAL_ERROR, error)
      } else {
        this.$store.dispatch(actionTypes.UPDATE_PROFILE, this.updatedUser)
      }
    }
  }
}
</script>
