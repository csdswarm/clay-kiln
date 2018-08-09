<template>
  <div id="vue-app-mount-point">
    <router-view/>
  </div>
</template>

<script>

import * as mutationTypes from '@/vuex/mutationTypes'
import { handlebars } from '../config/initHandlebars'

export default {
  name: 'App',
  created: function () {

    // Load SPA Payload
    if (window.spaPayload) {
      this.$store.commit(mutationTypes.LOAD_SPA_PAYLOAD, window.spaPayload)
    } else {
      throw new Error('SPA Payload failed to load.')
    }

    // Init and load Handlebars instance
    this.$store.commit(mutationTypes.LOAD_HANDLEBARS, { handlebars })

  },
  computed: {},
  methods: {
    
  },
  components: {}
}

</script>
