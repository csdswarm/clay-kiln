<template>
  <nav-menu-button id="newPageOverride" @nav-click="openNav">New Page</nav-menu-button>
</template>
<script>
'use strict';

const { setItem } = require('./clay-kiln-utils'),
  { navMenuButton } = window.kiln.utils.components,
  buttonId = 'new-page-override';

module.exports = {
  methods: {
    openNav() {
      setItem('claymenu:activetab', 'newPageOverride');
      this.$store.dispatch('toggleDrawer', 'newPageOverride');
    }
  },
  components: {
    navMenuButton
  }
};
</script>
