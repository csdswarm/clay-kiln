<!-- Station Theme Manager Button -->
<template>
    <nav-menu-button :id="id" @nav-click="toggleDrawer" class="national-subscriptions__button">
        <span>National Subscriptions</span>
    </nav-menu-button>
</template>

<script>
const navMenuButton = window.kiln.utils.components.navMenuButton;

export default {
    data() {
        return {
            id: 'national-subscriptions'
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
