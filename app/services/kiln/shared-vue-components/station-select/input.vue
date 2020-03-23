<template>
  <div class="station-select">
    <div v-if="!hasManyStations"
      class="station-select__label">

      Station: {{ selectedItem.label || '&lt;no station&gt;' }}
    </div>

    <ui-select v-else
      class="station-select__input"
      has-search
      label="Select a station"
      placeholder="Search a station"
      :options="items"
      v-model="selectedItem"
    ></ui-select>
  </div>
</template>

<script>
import _ from 'lodash';
import { mapGetters, mapState } from 'vuex';
import { storeNs } from './index.js';
import { DEFAULT_STATION } from '../../../universal/constants';

const { UiButton, UiSelect } = window.kiln.utils.components,
  nationalSlug = DEFAULT_STATION.site_slug;

export default {
  name: 'station-select',
  props: {
    initialSelectedSlug: String,
    initialSelectedCallsign: String,
    stations: Object
  },
  created() {
    this.stationsBySlug = this.stations
      || window.kiln.locals.stationsIHaveAccessTo;
    this.initItems();
    this.initSelectedItem();
  },
  data() {
    return {
      stationsBySlug: {}
    };
  },
  components: {
    'ui-select': UiSelect
  },
  methods: {
    initItems() {
      const items = _.chain(this.stationsBySlug)
        .map((station, slug) => {
          const { callsign, name } = station;

          return {
            // the national station callsign is for coding purposes afik and would
            //   probably confuse editors.
            label: callsign === 'NATL-RC'
              ? name
              : `${name} | ${callsign}`,
            value: station
          };
        })
        .sortBy('label')
        .value();

      this.$store.commit(`${storeNs}/_setItems`, items);
    },

    initSelectedItem() {
      let searchPredicate = this.stationsBySlug[nationalSlug]
        ? item => item.value.slug === nationalSlug
        // otherwise just get the first one
        : item => item;

      if (this.initialSelectedSlug) {
        searchPredicate = item => item.value.slug === this.initialSelectedSlug;
      } else if (this.initialSelectedCallsign) {
        searchPredicate = item => item.value.callsign === this.initialSelectedCallsign;
      }

      this.$store.commit(`${storeNs}/_setSelectedItem`, this.items.find(searchPredicate) || {});
    }
  },
  computed: Object.assign(
    {},
    mapState(storeNs, {
      items: state => state._items
    }),
    mapGetters(storeNs, ['hasManyStations']),
    {
      selectedItem: {
        get() {
          return this.$store.state[storeNs]._selectedItem;
        },
        set(item) {
          this.$store.commit(`${storeNs}/_setSelectedItem`, item);
        }
      }
    }
  )
}

</script>
