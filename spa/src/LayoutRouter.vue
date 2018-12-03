<template>
  <component v-bind:is="this.activeLayoutComponent"></component>
</template>

<script>

// Import dependencies.
import axios from 'axios'
import * as mutationTypes from '@/vuex/mutationTypes'
import OneColumnLayout from '@/views/OneColumnLayout'
import OneColumnFullWidthLayout from '@/views/OneColumnFullWidthLayout'
import TwoColumnLayout from '@/views/TwoColumnLayout'
import MetaManager from '@/lib/MetaManager'
import QueryPayload from '@/lib/QueryPayload'

// Instantiate libraries.
const metaManager = new MetaManager()
const queryPayload = new QueryPayload()

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
      } else if (!spaPayload.secondary) {
        nextLayoutComponent = 'OneColumnFullWidthLayout'
      } else {
        nextLayoutComponent = 'OneColumnLayout'
      }

      return nextLayoutComponent
    },
    getNextSpaPayload: async function getNextSpaPayload (destination) {
      try {
        const nextSpaPayloadResult = await axios.get(`//${destination}?json`, {
          headers: {
            'x-amphora-page-json': true
          }
        })
        nextSpaPayloadResult.data.locals = this.$store.state.spaPayloadLocals
        return nextSpaPayloadResult.data
      }
      catch (e) {
        const nextSpaPayloadResult = await axios.get(`//${window.location.hostname}/_pages/404.json`)
        nextSpaPayloadResult.data.locals = this.$store.state.spaPayloadLocals
        return nextSpaPayloadResult.data
      }
    },
    /**
     * 
     * Returns an object with all the payload data expected by client.js consumers of the SPA "pageView" event.
     * 
     * @param {object} to - A Vue Router "to" object.
     * @param {object} spaPayload - The handlebars context payload data associated with the "next" page.
     */
    buildPageViewEventData: function buildPageViewEventData (to, spaPayload) {
      const nextTitleComponentData = queryPayload.findComponent(spaPayload.head, 'meta-title')
      const nextMetaDescriptionData = queryPayload.findComponent(spaPayload.head, 'meta-description')
      const nextMetaImageData = queryPayload.findComponent(spaPayload.head, 'meta-image')

      return {
        toTitle: (nextTitleComponentData && nextTitleComponentData.title) ? nextTitleComponentData.title : '',
        toDescription: (nextMetaDescriptionData && nextMetaDescriptionData.description) ? nextMetaDescriptionData.description : '',
        toMetaImageUrl: (nextMetaImageData && nextMetaImageData.imageUrl) ? nextMetaImageData.imageUrl : '',
        toPath: to.path
      }
    }
  },
  components: {
    'OneColumnLayout': OneColumnLayout,
    'OneColumnFullWidthLayout': OneColumnFullWidthLayout,
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

      // Update Meta Tags and other appropriate sections of the page that sit outside of the SPA
      metaManager.updateExternalTags(this.$store.state.spaPayload)

      // Build pageView event data
      const pageViewEventData = this.buildPageViewEventData(to, this.$store.state.spaPayload)

      // Call global pageView event.
      let event = new CustomEvent(`pageView`, {
        detail: pageViewEventData
      })
      document.dispatchEvent(event)
    }
  }
}

</script>
