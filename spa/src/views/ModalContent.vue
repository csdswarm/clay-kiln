<template>
  <div class="account">
    <button class="closeModal" @click="$modal.hide('modal')"></button>
    <radio-com-header/>
    <div v-if="loaded">
      <radio-com-form>
        <component v-bind:is="modalComponent"></component>
      </radio-com-form>
    </div>
    <loader/>
  </div>
</template>

<script>
import RadioComHeader from './account/components/RadioComHeader'
import RadioComForm from './account/components/RadioComForm'
import Loader from './account/components/Loader'
import { mapState } from 'vuex'
import * as actionTypes from '@/vuex/actionTypes'

export default {
  name: 'Modal',

  components: {
    RadioComHeader,
    RadioComForm,
    Loader
  },

  computed: {
    ...mapState([
      'modalComponent',
      'metadata'
    ]),
    loaded: (state) => Object.keys(state.metadata).length
  },

  mounted () {
    this.$store.dispatch(actionTypes.GET_METADATA)
  }
}

</script>
