<template>
  <div class="vue-wrapper">
    <div class="top" data-editable="top"><div v-html="this.componentList('top')"></div></div>
    <div class="wrapper">
      <h1>TWO COLUMN LAYOUT</h1>
      <div class="main" data-editable="main"><div v-html="this.componentList('main')"></div></div>
      <div class="secondary" data-editable="secondary"><div v-html="this.componentList('secondary')"></div></div>
    </div>
    <footer class="bottom" data-editable="bottom"><div v-html="this.componentList('bottom')"></div></footer>
    <div class="kiln-internals" data-editable="kilnInternals"><div v-html="this.componentList('kilnInternals')"></div></div>
  </div>
</template>

<script>

import BaseLayout from '@/views/mixins/BaseLayout'

export default {
  mixins: [ BaseLayout ],
  name: 'TwoColumnLayout',
  data: function () {
    return {}
  },
  computed: {},
  methods: {},
  components: {}
}

</script>
