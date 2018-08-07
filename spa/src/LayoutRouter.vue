<template>
  <component v-bind:is="this.activeLayoutComponent"></component>
</template>

<script>

import axios from 'axios'
import OneColumnLayout from '@/views/OneColumnLayout'
import TwoColumnLayout from '@/views/TwoColumnLayout'

export default {
  name: 'LayoutRouter',
  created () {

    // Load initial layout. TODO - move this into vuex store?
    this.activeLayoutComponent = this.layoutRouter(this.$route.path)
    
  },
  data: function () {
    return {
      activeLayoutComponent: null // TODO - move this into vuex store?
    }
  },
  computed: {},
  methods: {
    layoutRouter (path) {

      // Mock routing.
      let nextLayoutComponent = null
      if (Math.random() >= 0.5) {
        nextLayoutComponent = 'OneColumnLayout'
      } else {
        nextLayoutComponent = 'TwoColumnLayout'
      }

      return nextLayoutComponent
    }
  },
  components: {
    'OneColumnLayout': OneColumnLayout,
    'TwoColumnLayout': TwoColumnLayout
  },
  watch: {
    '$route' (to, from) {
      
      // TODO Fetch data for next "pageview" with axios

      // Load matched Layout Component.
      this.activeLayoutComponent = this.layoutRouter(to.path)

      // TODO Commit fetched data after setting correct layout component to kick off re-rendering components.

    }
  }
}

</script>
