<template>
  <div v-if="!hasManyStations"
    class="station-select station-select-label">

    Station: {{ selectedItem.label || '&lt;no station&gt;' }}
  </div>

  <ui-select v-else
    class="station-select station-select-input"
    has-search
    label="Select a station"
    placeholder="Search a station"
    :options="items"
    v-model="selectedItem"
  ></ui-select>
</template>

<script>
import _ from 'lodash';
import { mapGetters, mapState } from 'vuex';

const { UiSelect } = window.kiln.utils.components,
  // the national station doesn't have a slug
  nationalSlug = '',
  // Ns = namespace
  storeNs = 'stationSelect',
  store = {
    namespaced: true,
    state: {
      // _items and _selectedItem should not be consumed by other components
      _items: [],
      _selectedItem: {}
    },
    getters: {
      hasManyStations(state) {
        return state._items.length > 1;
      },
      isLabel(_state, getters) {
        return !getters.hasManyStations;
      },
      selectedStation(state) {
        return state._selectedItem.value;
      }
    },
    mutations: {
      _setItems(state, val) {
        state._items = val
      },
      _setSelectedItem(state, val) {
        state._selectedItem = val
      }
    }
  };

export default {
  name: 'station-select',
  storeNs,
  props: {
    initialSelectedSlug: String,
    initialSelectedCallsign: String
  },
  created() {
    this.$store.registerModule(storeNs, store);

    this.stationsBySlug = window.kiln.locals.stationsIHaveAccessTo;
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
