<template>
  <section class="layout layout--one-column">
    <section class="layout__top" data-editable="top" v-html="this.componentList('top')"></section>
    <header class="layout__page-header" data-editable="pageHeader" v-html="this.componentList('pageHeader')"></header>
    <section class="layout__top">
      <section class="content__main" data-editable="main" v-html="this.componentList('main')"></section>
    </section>
    <footer class="layout__bottom" data-editable="bottom" v-html="this.componentList('bottom')"></footer>
  </section>
</template>

<script>

import BaseLayout from '@/views/mixins/BaseLayout'

export default {
  mixins: [ BaseLayout ],
  name: 'OneColumnFullWidthLayout',
  data: function () {
    return {}
  },
  computed: {},
  methods: {},
  components: {}
}

</script>
