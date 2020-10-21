<docs>
    # Station Settings Mamanger Kiln Drawer Button
</docs>

<template>
    <nav-menu-button :id="id" @nav-click="toggleDrawer">
        <span>Station Settings</span>
    </nav-menu-button>
</template>

<script>
const navMenuButton = window.kiln.utils.components.navMenuButton;

export default {
    data() {
        return {
            id: 'station-settings-manager'
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
