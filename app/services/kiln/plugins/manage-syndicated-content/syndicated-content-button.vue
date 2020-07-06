<!-- Manage Syndicated Content Tab -->
<template>
    <nav-menu-button :id="id" @nav-click="toggleDrawer" class="manage-syndicated-content-menu">
        <span>Manage Syndicated Content</span>
    </nav-menu-button>
</template>

<script>
const navMenuButton = window.kiln.utils.components.navMenuButton;

export default {
    data() {
        return {
            id: 'manage-syndicated-content'
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