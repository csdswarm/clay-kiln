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
      this.$store.commit(mutationTypes.LOAD_INITIAL_SPA_PAYLOAD, window.spaPayload)
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

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
