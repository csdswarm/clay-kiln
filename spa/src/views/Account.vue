<template>
  <div class="account">
    <radio-com-header/>
    <div v-if="loaded">
      <radio-com-form>
        <component v-bind:is="accountComponent"></component>
      </radio-com-form>
    </div>
    <div v-if="modalLoading">
      <loader/>
    </div>
  </div>
</template>

<script>
import RadioComHeader from './account/components/RadioComHeader'
import RadioComForm from './account/components/RadioComForm'
import Loader from './account/components/Loader'
import { mapState } from 'vuex'
import * as actionTypes from '@/vuex/actionTypes'

export default {
  name: 'Account',

    computed: {
    ...mapState([
      'accountComponent',
      'metadata',
      'modalLoading'
    ]),
    loaded: (state) => Object.keys(state.metadata).length
  },

  components: {
    RadioComHeader,
    RadioComForm,
    Loader
  },
  mounted () {
    this.$store.dispatch(actionTypes.GET_METADATA)
  }
}

</script>
