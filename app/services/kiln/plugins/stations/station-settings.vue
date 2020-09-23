<template>
  <div class="station-settings">
    <h3 class="station-settings__main-title">
      Options:
    </h3>
    <form>
      <div class="form-group">
        <UiCheckbox label="Enable Global Sponsorship" v-model="stationOptions.isGlobalSponsorshipEnabled" @input="onGlobalSponsorshipInput" />
      </div>
    </form>
  </div>
</template>


<script>
  import axios from 'axios';

  const { UiCheckbox } = window.kiln.utils.components,
    stationOptionsEndpoint = '/rdc/station-options/';

  export default {
    data() {
      return {
        stationOptions: {
          ...window.kiln.locals.stationOptions
        }
      }
    },
    props: {
      stationName: String,
      stationLogo: String
    },
    methods: {
      showSnack (message, duration = 4000) {
        this.$store.dispatch('showSnackbar', {
          message,
          duration: 4000
        })
      },
      handleError (err, duration = 4000) {
        console.error(err)
        this.showSnack(`Error: ${err.message}`)
      },
      onGlobalSponsorshipInput(e) {
        const putData = {
          ...this.stationOptions
        };
        console.log('[putDatas]', putData);
        axios.put(stationOptionsEndpoint, putData)
        .then(response => this.showSnack(
          `Enable Global Sponsorship: ${this.stationOptions.isGlobalSponsorshipEnabled}`
        ))
        .catch(err => this.handleError)
      }
    },
    components: {
      UiCheckbox
    }
  }
</script>