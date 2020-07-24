<!-- Station Theme Manager Button -->
<template>
    <nav-menu-button :id="id" @nav-click="toggleDrawer" style="text-align: left">
        <span>Subscriptions</span>
    </nav-menu-button>
</template>

<script>
const navMenuButton = window.kiln.utils.components.navMenuButton;

export default {
    data() {
        return {
            id: 'content-subscriptions'
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
