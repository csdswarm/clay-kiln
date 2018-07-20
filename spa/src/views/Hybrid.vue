<template>
  <div class="vue-wrapper">
    <div class="top" data-editable="top"><div v-html="this.componentList('top')"></div></div>
    <div class="wrapper">
      <div class="main" data-editable="main"><div v-html="this.componentList('main')"></div></div>
      <div class="secondary" data-editable="secondary"><div v-html="this.componentList('secondary')"></div></div>
    </div>
    <footer class="bottom" data-editable="bottom"><div v-html="this.componentList('bottom')"></div></footer>
    <div class="kiln-internals" data-editable="kilnInternals"><div v-html="this.componentList('kilnInternals')"></div></div>
  </div>
</template>

<script>

import handlebarsVanilla from 'handlebars'
import clayHBS from 'clayhandlebars'
const handlebars = clayHBS(handlebarsVanilla) //NOTE: MUST COMMENT OUT FILESYSTEM CODE IN CLAYHANDLEBARS INDEX.JS FILE. See /node_modules-clayhandlbars-index.js

console.log(handlebars, 'THE HANDLEBARS INSTANCE')

export default {
  name: 'hybrid',
  data: function () {
    return {
      spaPayload: {},
    }
  },
  created: function () {

    if (window.spaPayload) {
      this.spaPayload = window.spaPayload
    } else {
      throw new Error('SPA Payload failed to load.')
    }

  },
  computed: {},
  methods: {
    componentList: function(stateSliceKey) {

      // Register partials from kiln - this has to happen here in order to not end up with a race condition error.
      // For slightly better performance we'll only do this once by checking if the article partial has been loaded already.
      if (!(handlebars.partials && handlebars.partials.article)) {
        for (let key in window.kiln.componentTemplates) {
          handlebars.registerPartial(key, handlebars.template(window.kiln.componentTemplates[key]));
        }
      }

      // The handlebars wrapper template will basically just load the component-list partial and pass in the appropriate property/key on this.spaPayload.
      const handlebarsWrapper = handlebars.compile(`{{> component-list ${stateSliceKey} }}`);

      // Pass entire payload to wrapper template, template will pull correct data off it via stateSliceKey.
      return handlebarsWrapper(this.spaPayload);

    }
  },
  components: {}
}

</script>
