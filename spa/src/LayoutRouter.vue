<template>
  <component v-bind:is="this.activeLayoutComponent"></component>
</template>

<script>

import axios from 'axios'
import * as mutationTypes from '@/vuex/mutationTypes'
import OneColumnLayout from '@/views/OneColumnLayout'
import TwoColumnLayout from '@/views/TwoColumnLayout'

export default {
  name: 'LayoutRouter',
  created () {
    // Load initial layout.
    this.activeLayoutComponent = this.layoutRouter(this.$store.state.spaPayload)
  },
  data: function () {
    return {
      activeLayoutComponent: null
    }
  },
  computed: {},
  methods: {
    /**
     *
     * Contains Layout template matching logic.
     *
     * Match a given spa payload with a Vue layout component
     *
     * @param {object} spaPayload - The handlebars context payload data.
     * @returns {string} - Matched Layout component name.
     */
    layoutRouter (spaPayload) {
      let nextLayoutComponent = null

      // Match to correct layout template by querying for existence of "tertiary" property on spa payload object.

      if (spaPayload.tertiary) {
        nextLayoutComponent = 'TwoColumnLayout'
      } else {
        nextLayoutComponent = 'OneColumnLayout'
      }

      return nextLayoutComponent
    },
    getNextSpaPayload: async function getNextSpaPayload (destination) {
      const nextSpaPayloadResult = await axios.get(`//${destination}`, {
        headers: {
          'x-amphora-page-json': true
        }
      })

      nextSpaPayloadResult.data.locals = this.$store.state.spaPayloadLocals

      return nextSpaPayloadResult.data
    }
  },
  components: {
    'OneColumnLayout': OneColumnLayout,
    'TwoColumnLayout': TwoColumnLayout
  },
  watch: {
    '$route': async function (to, from) {
      // Get SPA payload data for next path.
      const spaPayload = await this.getNextSpaPayload(window.location.hostname + to.path)

      // Load matched Layout Component.
      this.activeLayoutComponent = this.layoutRouter(spaPayload)

      // Commit next payload to store to kick off re-render.
      this.$store.commit(mutationTypes.LOAD_SPA_PAYLOAD, spaPayload)

      // Call global pageView event: THIS MUST BE LAST IN FUNCTION AFTER META DATA UPDATES
      let event = new CustomEvent(`pageView`)
      document.dispatchEvent(event)
    }
  }
}

</script>
