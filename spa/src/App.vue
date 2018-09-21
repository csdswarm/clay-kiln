<template>
  <div id="vue-app-mount-point">
    <router-view/>
  </div>
</template>

<script>

import * as mutationTypes from '@/vuex/mutationTypes'
import { handlebars } from '../config/initHandlebars'
import { Base64 } from 'js-base64'

export default {
  name: 'App',
  created: function () {
    // Load SPA Payload
    if (window.spaPayload) {
      // Decode payload from base64 into JSON and parse for loading into store.
      const jsonPayload = Base64.decode(window.spaPayload)
      const payload = JSON.parse(jsonPayload)

      this.$store.commit(mutationTypes.LOAD_SPA_PAYLOAD_LOCALS, payload.locals)
      this.$store.commit(mutationTypes.LOAD_SPA_PAYLOAD, payload)
    } else {
      throw new Error('SPA Payload failed to load.')
    }

    // Init and load Handlebars instance
    this.$store.commit(mutationTypes.LOAD_HANDLEBARS, { handlebars })
  },
  computed: {},
  methods: {},
  components: {}
}

</script>
