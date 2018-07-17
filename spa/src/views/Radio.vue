<template>
  <div class="radio">
    <h1>Radio.com SPA Proof Of Concept</h1>
    <h2>Clay Handlebars Paragraph Template Example Below</h2>
    <ClayParagraph/>
  </div>
</template>

<script>
// @ is an alias to /src
import ClayParagraph from '@/WrappedClayComponents/ClayParagraph.vue'

export default {
  name: 'radio',
  components: {
    ClayParagraph
  }
}
</script>
