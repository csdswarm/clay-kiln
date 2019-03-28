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
      return window.open(this.link, '_blank')
    }
  }
}
</script>

<style>
.facebook-button {
  cursor: pointer;
  opacity: 0.9;
  transition: opacity 50ms;
}

.facebook-button:hover{
  opacity: 1;
}
</style>
