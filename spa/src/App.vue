<template>
  <div id="vue-app-mount-point" v-bind:class="{ 'loading-spinner': loadingSpinnerActive }">
    <router-view/>
  </div>
</template>

<script>

export default {
  name: 'App',
  computed: {
    loadingSpinnerActive: function () {
      return this.$store.state.loadingAnimation
    }
  },
  methods: {},
  components: {}
}

</script>
