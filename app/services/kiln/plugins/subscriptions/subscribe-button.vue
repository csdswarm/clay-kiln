<template><span></span></template>

<script>
'use strict';
const PUBLISHED = 'publish',
  UNPUBLISHED = 'unpublish';

module.exports = {
  mounted() {
    this.$store.subscribe((mutation, state) => {
      // mutation has two properties, the type and the payload
      // state contains the mutated state
      switch(mutation.type) {
        case 'UPDATE_PAGE_STATE':
          if ([PUBLISHED, UNPUBLISHED].includes(mutation.payload.history[mutation.payload.history.length - 1].action)) {
            setTimeout(() => { location.reload(); }, 200);
          }
          break;
        default:

      }
    });
  }
};
</script>
