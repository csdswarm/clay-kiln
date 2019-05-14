<template><span>TEST SUBSCRIBE BUTTON</span></template>

<script>
'use strict';

module.exports = {
  mounted() {
    this.$store.subscribe((mutation, state) => {
      // mutation has two properties, the type and the payload
      // state contains the mutated state
      switch(mutation.type) {
        case 'PAGE_PUBLSIH':
        case 'PAGE_UNPUBLISH':
            location.reload();
            break;
        default:

      }
    });
  }
};
</script>