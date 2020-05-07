<!-- Article Import -->
<template>
    <nav-menu-button :id="id" @nav-click="toggleDrawer">
        <span>Valid Script Source</span>
    </nav-menu-button>
</template>

<script>
const navMenuButton = window.kiln.utils.components.navMenuButton;

export default {
    data() {
        return {
            id: 'valid-source'
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
