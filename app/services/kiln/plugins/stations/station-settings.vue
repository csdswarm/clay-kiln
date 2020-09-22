<template>
  <div class="station-settings">
    <h3 class="station-settings__main-title">
      Options:
    </h3>
    <form>
      <div class="form-group">
        <UiCheckbox label="Enable Global Sponsorship" v-model="stationSettings.isGlobalSponsorshipEnabled" @input="onGlobalSponsorshipInput" />
      </div>
    </form>
  </div>
</template>


<script>
  const { UiCheckbox } = window.kiln.utils.components;
  export default {
    data() {
      return {
        stationSettings: {
          isGlobalSponsorshipEnabled: false
        }
      }
    },
    props: {
      stationName: String,
      stationLogo: String
    },
    methods: {
      onGlobalSponsorshipInput(e) {
        console.log(e);
        console.log('[stationSettings]', this.stationSettings.isGlobalSponsorshipEnabled);
      }
    },
    components: {
      UiCheckbox
    }
  }
</script>