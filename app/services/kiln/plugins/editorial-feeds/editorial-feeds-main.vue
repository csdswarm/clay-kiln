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
        <tr v-for="station in stationEditorials" :key="station.id">
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

const { UiButton, UiCheckbox } = window.kiln.utils.components;

export default {
  name: "EditorialManagement",
  data: function () {
    return { 
      ascendable: false,
      columnTitles: columnTitles,
      sortColumn: "",
      stationEditorials: []
    };
  },
  components: {
    UiButton,
    UiCheckbox,
  },
  computed: {
    columns: function () {
      return this.stationEditorials.length ? ['STATION', ...this.columnTitles] : [];
    },
    enableUpdate: function() {
      return this.stationEditorials.reduce((editable, station) => {
        return editable || station.edited;
      }, false);
    },
  },
  methods: {
    fetchEditorialFeeds: async function () {
      // TODO: Connect with backend API endpoint.
      this.stationEditorials = editorials;
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
