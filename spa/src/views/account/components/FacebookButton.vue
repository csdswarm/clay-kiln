<template>
  <img
    class="facebook-button"
    src="../../../assets/login-fb.png"
    width="210"
    height="40"
    @click.prevent="onClick"
  >
</template>

<script>
export default {
  name: 'FacebookButton',

  props: {
    link: { type: String, required: true }
  },

  methods: {
    onClick () {
      const win = window.open(this.link, '_blank')
      win.onbeforeunload = () => {
        this.$emit('loggedin');
      }
    }
  }
}
</script>
