<!-- Alerts Manager -->
<template>
    <nav-menu-button :id="id" @nav-click="toggleDrawer">
        <span>Editorial Groups</span>
    </nav-menu-button>
</template>

<script>
const navMenuButton = window.kiln.utils.components.navMenuButton;

export default {
    data() {
        return {
            id: 'editorial-mgmt'
        }
    },
    methods: {
        toggleDrawer() {
            this.$store.dispatch('toggleDrawer', this.id);
        }
    },
    components: {
        navMenuButton
    }
}
</script>
