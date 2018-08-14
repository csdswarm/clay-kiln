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

export default {
  name: 'OneColumnLayout',
  data: function () {
    return {}
  },
  computed: {},
  methods: {
    componentList: function(stateSliceKey) {

      // The handlebars wrapper template will basically just load the component-list partial and pass in the appropriate property/key on this.spaPayload.
      const handlebarsWrapper = this.$store.state.handlebars.compile(`{{> component-list ${stateSliceKey} }}`);

      // Pass entire payload to wrapper template, template will pull correct data off it via stateSliceKey.
      return handlebarsWrapper(this.$store.state.spaPayload);

    }
  },
  components: {}
}

</script>
