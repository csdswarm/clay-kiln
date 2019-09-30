<template>
  <div class="station-select">
    <div v-if="stationSelectItems.length === 1"
      class="station-select__label">

      Station: {{ selectedStation.label }}
    </div>
    <ui-select v-else-if="stationIsSelectable"
      class="station-select__ui-select"
      has-search
      label="Select a station"
      placeholder="Search a station"
      :options="stationSelectItems"
      v-model="selectedStation"
    ></ui-select>
  </div>
</template>

<script>
import _ from 'lodash';
import axios from 'axios';

const { UiSelect } = window.kiln.utils.components,
  // the national station doesn't have a slug
  nationalSlug = '',
  // Ns = namespace
  storeNs = 'stationSelect',
  store = {
    // important!
    namespaced: true,
    state: {
      selectedStationSlug: ''
    },
    mutations: {
      setSelectedStationSlug(state, slug) {
        state.selectedStationSlug = slug
      }
    }
  };

export default {
  name: 'station-select',
  async created() {
    this.$store.registerModule(storeNs, store);

    const { data: slugToNameAndCallsign } = await axios.get('/new-page-stations', { withCredentials: true })

    this.stationSelectItems = _.chain(slugToNameAndCallsign)
      .map(({ name, callsign }, slug) => {
        return {
          // the national station callsign is for coding purposes afik and would
          //   probably confuse editors.
          label: callsign === 'NATL-RC'
            ? name
            : `${name} | ${callsign}`,
          value: slug
        };
      })
      .sortBy('label')
      .value();

    const selectedStation = slugToNameAndCallsign[nationalSlug]
      ? this.stationSelectItems.find(selectItem => selectItem.value === nationalSlug)
      : this.stationSelectItems[0];

    this.selectedStation = selectedStation || '';
  },
  data() {
    return {
      stationSelectItems: [],
      selectedStation: {}
    };
  },
  watch: {
    selectedStation({ value }) {
      this.$store.commit(`${storeNs}/setSelectedStationSlug`, value);
    }
  },
  components: {
    'ui-select': UiSelect
  },
  computed: {
    stationIsSelectable() {
      return this.stationSelectItems.length > 1
    }
  },
  storeNs
}

</script>
