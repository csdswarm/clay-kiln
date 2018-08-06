<template>
  <div id="vue-app-mount-point">
    <router-view/>
  </div>
</template>

<script>

import * as mutationTypes from '@/vuex/mutationTypes'
import handlebarsVanilla from 'handlebars'
import clayHBS from 'clayhandlebars'
const handlebars = clayHBS(handlebarsVanilla)

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

    // Register partials from kiln - this has to happen here in order to not end up with a race condition error.
    // For slightly better performance we'll only do this once by checking if the article partial has been loaded already.
    if (!(handlebars.partials && handlebars.partials.article)) {
      for (let key in window.kiln.componentTemplates) {
        handlebars.registerPartial(key, handlebars.template(window.kiln.componentTemplates[key]));
      }
    }

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
