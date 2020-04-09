<template>
  <section class="layout layout--one-column">
    <section class="layout__top" v-html="this.componentList('top')"></section>
    <section class="layout__topSection" data-editable="topSection" v-html="this.componentList('topSection')"></section>
    <section class="layout__topAd" data-editable="top" v-html="this.componentList('topAd')"></section>
    <header>
      <div class="layout__layout-header" data-editable="layoutHeader" v-html="this.componentList('layoutHeader')"></div>
      <div class="layout__page-header" data-editable="pageHeader" v-html="this.componentList('pageHeader')"></div>
    </header>
    <section class="layout__content">
      <section class="content__banner" data-editable="banner" v-html="this.componentList('banner')"></section>
      <section class="content__main" data-editable="main" v-html="this.componentList('main')"></section>
      <section class="content__secondary" data-editable="secondary" v-html="this.componentList('secondary')"></section>
    </section>
    <footer>
      <div class="layout__bottomAd" data-editable="bottomAd" v-html="this.componentList('bottomAd')"></div>
      <div class="layout__bottomSection" data-editable="bottomSection" v-html="this.componentList('bottomSection')"></div>
      <div class="layout__bottom" v-html="this.componentList('bottom')"></div>
    </footer>
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
