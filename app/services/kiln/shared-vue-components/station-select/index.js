'use strict';

// Ns = namespace
const storeNs = 'stationSelect',
  store = {
    namespaced: true,
    state() {
      // _items and _selectedItem should not be consumed by other components
      return {
        _items: [],
        _selectedItem: {}
      };
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
        state._items = val;
      },
      _setSelectedItem(state, val) {
        state._selectedItem = val;
      }
    }
  };

module.exports = {
  store,
  storeNs
};
