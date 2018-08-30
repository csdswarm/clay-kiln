<template>
  <div id="vue-app-mount-point">
    <router-view/>
  </div>
</template>

<script>

import * as mutationTypes from '@/vuex/mutationTypes'
import { handlebars } from '../config/initHandlebars'
import _ from 'lodash';

export default {
  name: 'App',
  created: function () {
    // Ensure that all handlebar helpers are available for rendering @TODO: Remove once solution is found for import/export vs require bug in webpack
    _.forOwn(window.kiln.helpers, (helperFn, helperName) => {
      handlebars.registerHelper(helperName, helperFn);
    });

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
