<template>
  <div id="vue-app-mount-point" v-bind:class="{ 'vue-app-mount-point--loading': loadingSpinnerActive }">
    <router-view/>
  </div>
</template>

<script>
import SpaScroll from './lib/SpaScroll'

export default {
  name: 'App',
  computed: {
    loadingSpinnerActive: function () {
      return this.$store.state.loadingAnimation
    }
  },
  methods: {},
  components: {},
  mounted () {
    // If deep link hash exists in slug, handle scrolling to it on initial pageload/SPA mount.
    if (this.$route.hash) {
      this.$nextTick(() => {
        SpaScroll.initialPageloadHashLinkScroll(this.$route.hash)
      })
    }

    // Attach dynamic gallery slide slug logic to scroll event.
    SpaScroll.attachGallerySlideDynamicSlug.call(this)
  }
}

</script>
