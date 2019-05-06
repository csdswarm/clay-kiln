<template>
  <div v-if="modalLoading" class="form-loading">
    <img
      class="loading-image"
      src="../../../assets/spinner.gif" >
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Loader',

  computed: {
    ...mapState([
      'modalLoading'
    ])
  }
}
</script>
