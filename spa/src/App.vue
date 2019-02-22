<template>
  <div id="vue-app-mount-point" v-bind:class="{ 'vue-app-mount-point--loading': loadingSpinnerActive }">
    <router-view/>
  </div>
</template>

<script>
import SpaScroll from './lib/SpaScroll'
import PlayerInterface from './lib/PlayerInterface'

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

    // Lazy-Load web player POC
    // TODO - This should only get called on a route that actually auto-plays 
    // the player so we lazy-load in the player only when we actually need it.
    PlayerInterface.loadPlayer.call(this)
      .then(() => {
        PlayerInterface.initializePlayer.call(this)
        return PlayerInterface.loadStationByIdAndPlay.call(this, 417) // TODO - this station id should not be hard coded...
      })
      .then(() => {
        console.log('the station should be loaded and playing.')



        // Programattically control station via the following examples
        // PlayerInterface.playerPlay.call(this)
        // PlayerInterface.playerPause.call(this)

      })


  }
}

</script>
