<docs>
  # Station Settings
</docs>

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
      stationLogo: String,
      stationId: String
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
        axios.put(`${stationOptionsEndpoint}${this.stationId}`, putData)
        .then(response => {
          this.showSnack(
            `Enable Global Sponsorship: ${this.stationOptions.isGlobalSponsorshipEnabled}`
          );
          window.kiln.locals.stationOptions = {
            ...this.stationOptions
          };
        })
        .catch(err => {
          this.handleError(err);
          this.stationOptions = {
            ...window.kiln.locals.stationOptions
          };
        })
      }
    },
    components: {
      UiCheckbox
    }
  }
</script>