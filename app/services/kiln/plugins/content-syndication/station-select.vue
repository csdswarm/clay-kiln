<!-- Station(s) Select-->
<docs>
  # Station(s) Select
</docs>
<template>
  <div class="station-select">
    <div v-if="stationOptions && stationOptions.length">
      <ui-select
        :placeholder="'Select Station(s)'"
        :hasSearch="true"
        :help="'Select station(s) to syndicate out to. You may search within the dropdown as well.'"
        :multiple="true"
        :options="stationOptions"
        :value="value"
        @input="updateSelectedStation"
      >
      </ui-select>
    </div>
  </div>
</template>
<script>
  const radioApi = require('../../../../services/client/radioApi'),
    UiSelect = window.kiln.utils.components.UiSelect,
    log = require('../../../../services/universal/log').setup({file: __filename});

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        selectedStation: this.data,
        stationOptions: null
      };
    },
    mounted () {
      this.populateStations()
    },
    computed: {
      value() {
        return this.selectedStation || [];
      },
    },
    methods: {
      /**
       *  This function is called when the component is mounted.
       *  It queries the api.radio.com for stations and sets them as selectable.
       */
      async populateStations() {
        try {
          const apiRequest = 'https://api.radio.com/v1/stations?page[size]=1000&sort=callsign',
            stationsResponse = await radioApi.get(apiRequest);

          if (stationsResponse) {
            this.stationOptions = stationsResponse.data.map(station => {
              return station.attributes.callsign;
            });
          }
        } catch (e) {}
      },
      /**
       *  This function is called when a station is selected from the dropdown. Sets it as currently selected.
       * @param {Object} input
       */
      updateSelectedStation(input) {
        try {
          this.selectedStation = input;
          this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.selectedStation })
        } catch (e) {}
      },
    },
    components: {
      UiSelect
    }
  }
</script>
