<template>
  <div class='editorial-feeds__wrapper'>
    <h2 class='editorial-feeds__main-title'>Subscriptions</h2>
    <div class="editorial-feeds__buttons">
      <ui-button
        color="green"
        :disabled="!enableUpdate"
        v-on:click="updateChanges"
        raised
      >
        Update Changes
      </ui-button>
    </div>
    <div class="editorial-feeds__filter-select">
      <ui-autocomplete
      help="Search For a station"
      name="'Station'"
      placeholder="Station"
      :suggestions="editorialOptions"
      @input="selectStation"
      >
      </ui-autocomplete>
    </div>
    <table class='editorial-feeds__table'>
      <thead class='editorial-feeds__table--head'>
        <th
          nowrap
          class="editorial-feeds__table--title"
          v-for="(col, index) in columns"
          :key="index"
          v-on:click="sortTable(col)"
        >
          {{ col }}
        </th>
        <span v-if="columns.length === 0"> There is no information</span>
      </thead>
        <tbody class="editorial-feeds__table--body">
          <tr v-for="station in filteredStationEditorials" :key="station.id">
            <td class="editorial-feeds__table--item">{{ station.callsign }}</td>
            <td
              class="editorial-feeds__table--item"
              v-for="(col, idx) in columnTitles"
              :key="idx"
            >
              <ui-checkbox
                :value="station.feeds[col] ? true : false"
                @change="updateFeed(station.id, col)"
              />
            </td>
          </tr>
        </tbody>
    </table>
  </div>
</template>
<script>
"use strict";

const radioApi = require("../../../../services/client/radioApi"),
  { editorials, newStationFeed, columnTitles } = require("./data");
const { UiButton, UiCheckbox, UiAutocomplete } = window.kiln.utils.components;

export default {
  name: "EditorialManagement",
  data: function () {
    return { 
      ascendable: false,
      columnTitles: columnTitles,
      sortColumn: "",
      stationEditorials: [],
      filteredStationEditorials: [],
      filteredStations: false,
    };
  },
  components: {
    UiButton,
    UiCheckbox,
    UiAutocomplete,
  },
  computed: {
    columns: function () {
      return this.stationEditorials.length ? ['STATION', ...this.columnTitles] : [];
    },
    editorialOptions: function () {
      if (this.stationEditorials.length > 0) 
        return this.stationEditorials.map(station => {
          return station.callsign
          });
      return [];
    },
    enableUpdate: function() {
      return this.stationEditorials.reduce((editable, station) => {
        return editable || station.edited;
      }, false);
    },
    editorialOptions: function () {
      if (this.stationEditorials.length > 0) 
        return this.stationEditorials.map(station => {
          return station.callsign
          });
      return [];
    },
    value() {
        return [];
      },
  },
  methods: {
    fetchEditorialFeeds: async function () {
      // TODO: Connect with backend API endpoint.
      this.stationEditorials = editorials;
      this.filteredStationEditorials = editorials;
    },

    updateChanges: function() {
      // TODO: Connect with API.
      // This is only for demostrating behavior. 
      const updatedStations = this.stationEditorials.filter(station => station.edited);

      this.stationEditorials.map(station => {
        this.$set(station, 'edited', false);
      });

      console.log(
        'Attempting update the edited Station Feeds',
        updatedStations
      );
    },

    updateFeed: function (stationId, feed) {
      this.stationEditorials = this.stationEditorials.map((station) => {
        if (station.id === stationId) {
          this.$set(station, 'edited', true);
          station.feeds[feed] = !station.feeds[feed];
        }
        return station;
      });
    },
    updateStation: function (station) {
      console.log(station)
    },
    selectStation: function (station) {
      if(station) {
        console.log('Filtering sttions');
        this.filteredStationEditorials = this.stationEditorials.filter(st => st.callsign.includes(station.toUpperCase()));
      } else {
        this.filteredStationEditorials = this.stationEditorials
      }
    },
    sortTable: function (col) {
      console.log('Sorting by column... ', col);
      if (this.sortColumn === col) {
        this.ascending = !this.ascending;
      } else {
        this.ascending = true;
        this.sortColumn = col;
      }

      var ascending = this.ascending;

      this.stationEditorials.sort(function (a, b) {
        if (
          col === 'STATION'
            ? a.callsign > b.callsign
            : a.feeds[col] > b.feeds[col]
        ) {
          return ascending ? 1 : -1;
        } else if (
          col === 'STATION'
            ? a.callsign < b.callsign
            : a.feeds[col] < b.feeds[col]
        ) {
          return ascending ? -1 : 1;
        }
        return 0;
      });
    },
  },
  mounted() {
    this.fetchEditorialFeeds();
  }
};
</script>
