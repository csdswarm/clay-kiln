<template><span></span></template>

<script>
'use strict';
const { debugLog } = require('../../../universal/utils'),
 { getComponentName } = require('clayutils'),
  PUBLISHED = 'publish',
  UNPUBLISHED = 'unpublish';

module.exports = {
  mounted() {
    let initialHistory;

    this.$store.subscribe((mutation, state) => {
      // mutation has two properties, the type and the payload
      // state contains the mutated state
      switch(mutation.type) {
        case 'PRELOAD_SUCCESS':
          initialHistory = state.page.state.history;
          break;
        case 'UPDATE_PAGE_STATE':
          if (!Array.isArray(initialHistory)) {
            debugLog(
              "subscribe-button.vue's -> UPDATE_PAGE_STATE ran without the"
              + " initialHistory being set to an array.  This is unexpected and"
              + " indicates a bug that should be looked into."
            );

            initialHistory = [];
          }

          const historyHasChanged = initialHistory.length !==
            mutation.payload.history.length,
            isContentPage = ['article', 'gallery'].includes(
              getComponentName(state.page.data.main[0]));
          if (
            historyHasChanged
            && !isContentPage
            && [PUBLISHED, UNPUBLISHED].includes(mutation.payload.history[mutation.payload.history.length - 1].action)
          ) {
            setTimeout(() => { location.reload(); }, 200);
          }
          break;
        default:
      }
    });
  }
};
</script>
