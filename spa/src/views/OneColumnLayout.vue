<template>
  <section class="layout layout--one-column">
    <section class="layout__top" data-editable="top" v-html="this.componentList('top')"></section>
    <header>
      <div class="layout__layout-header" data-editable="layoutHeader" v-html="this.componentList('layoutHeader')"></div>
      <div class="layout__page-header" data-editable="pageHeader" v-html="this.componentList('pageHeader')"></div>
    </header>
    <section class="layout__content">
      <section class="content__main" data-editable="main" v-html="this.componentList('main')"></section>
      <section class="content__secondary" data-editable="secondary" v-html="this.componentList('secondary')"></section>
    </section>
    <footer class="layout__bottom" data-editable="bottom" v-html="this.componentList('bottom')"></footer>
  </section>
</template>

<script>

import BaseLayout from '@/views/mixins/BaseLayout'

export default {
  mixins: [ BaseLayout ],
  name: 'OneColumnLayout',
  data: function () {
    return {}
  },
  computed: {},
  methods: {},
  components: {}
}

</script>
