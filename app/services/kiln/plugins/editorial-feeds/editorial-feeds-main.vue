<template>
  <div class='editorial-feeds__wrapper'>
    <h2 class='editorial-feeds__main-title'>Subscriptions</h2>
    <!-- <div class='editorial-feeds__buttons'>
      <ui-button @click='addStation'>Add Station</ui-button>
    </div> -->
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
            v-for="(val, name, index) in station.feeds"
            :key="index"
          >
            <ui-checkbox :value="val" @change="updateFeed(station.id, name)"/>
          </td>
          <td class="editorial-feeds__table--item">
            <ui-button color="green" v-on:click="updateStation(station)"
              >Update</ui-button
            >
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script>
"use strict";

const radioApi = require("../../../../services/client/radioApi"),
  { editorials, newStationFeed } = require("./data");

const { UiButton, UiCheckbox } = window.kiln.utils.components;

export default {
  name: "EditorialManagement",
  data: function () {
    return {
      ascendable: false,
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
      if (this.stationEditorials.length === 0) return [];
      return ['station', ...Object.keys(this.stationEditorials[0].feeds), ''];
    },
  },
  methods: {
    fetchEditorialFeeds: async function () {
      // TODO: Connect with backend API endpoint.
      this.stationEditorials = editorials;
      console.log(this.stationEditorials);
    },

    addStation: function () {
      this.stationEditorials.push(newStationFeed);
      console.log(
        'A new station was added but not saved',
        this.stationEditorials
      );
    },

    deleteStation: function (station) {
      console.log('Attempting to remove an element....');
      this.stationEditorials = this.stationEditorials.filter((elem) => {
        if (station.id === elem.id) {
          return false;
        }
        return elem;
      });
    },
    updateFeed: function (stationId, feed) {
      this.stationEditorials = this.stationEditorials.map((station) => {
        if (station.id === stationId) {
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
          col === 'station'
            ? a.callsign > b.callsign
            : a.feeds[col] > b.feeds[col]
        ) {
          return ascending ? 1 : -1;
        } else if (
          col === 'station'
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
    console.log('Fetching Saved Information...');
    this.fetchEditorialFeeds();
  },
};
</script>
