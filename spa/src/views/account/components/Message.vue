<template>
  <div class="message">
    <span
      v-if="modalMessage.message"
      :class="modalMessage.type"
    >{{ modalMessage.message }}</span>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Message',
  computed: {
    ...mapState([
      'modalMessage'
    ])
  }
}
</script>

<style>
  .error {
    text-align: center;
  }
</style>
