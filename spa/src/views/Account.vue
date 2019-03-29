<template>
  <div class="account">
    <radio-com-header/>
    <div v-if="loaded">
      <radio-com-form>
        <component v-bind:is="accountComponent"></component>
      </radio-com-form>
    </div>
    <div v-else>
      <loader/>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import RadioComHeader from './account/components/RadioComHeader'
import RadioComForm from './account/components/RadioComForm'
import Loader from './account/components/Loader'
import { mapState } from 'vuex'

export default {
  name: 'Account',
  data: function () {
    return {
      develop: process.env.NODE_ENV === 'local',
      error: null
    }
  },
  computed: {
    ...mapState([
      'accountComponent',
      'metadata'
    ]),
    loaded: (state) => Object.keys(state.metadata).length
  },
  methods: {
    getMetadata () {
      // if this is the first time that the account page had loaded, get the meta data and profile of a user
      if (!this.$store.state.metadata.app) {
        axios.get('/radium/v1/app/metadata')
          .then((result) => {
            this.$store.commit('SET_METADATA', result.data)
          })
      }
    }
  },
  components: {
    RadioComHeader,
    RadioComForm,
    Loader
  },
  mounted () {
    this.getMetadata()
  }
}

</script>
