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
        :disabled="disabled"
        @input="updateSelectedStation"
      >
      </ui-select>
    </div>
  </div>
</template>
<script>
  const UiSelect = window.kiln.utils.components.UiSelect;

  export default {
    props: ['name', 'data', 'schema', 'args', 'disabled'],
    data() {
      return {
        selectedStation: this.data,
        stationOptions: (window.kiln.locals.allStationsCallsigns || []).sort()
      };
    },
    computed: {
      value() {
        return this.selectedStation || [];
      },
    },
    methods: {
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
