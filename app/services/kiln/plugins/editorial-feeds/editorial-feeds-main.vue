<template>
  <div class='editorial-feeds__wrapper'>
    <h2 class='editorial-feeds__main-title'>Subscriptions</h2>
    <div class="editorial-feeds__buttons">
      <ui-button
        color="green"
        :disabled="!enableUpdate"
        v-on:click="submitChanges"
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
            <td class="editorial-feeds__table--item">{{ station.data.siteSlug }}</td>
            <td
              class="editorial-feeds__table--item"
              v-for="(col, idx) in columnTitles"
              :key="idx"
            >
              <ui-checkbox
                :value="station.data.feeds[col] ? true : false"
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
 { UiButton, UiCheckbox, UiAutocomplete } = window.kiln.utils.components;

export default {
  name: "EditorialManagement",
  data: function () {
    return { 
      sortColumn: "",
      stationEditorials: [],
      filteredStationEditorials: [],
      filteredStations: false,
      enableUpdate: false
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
          return station.data.siteSlug
          });
      return [];
    },
    value() {
        return [];
    },
    columnTitles() {
      return [
        'Trending',
        'AC',
        'Adult Hits',
        'Alternative',
        'CHR / Top 40',
        'Classic Hits',
        'Classic Rock',
        'Country',
        'Hip Hop',
        'Hot AC',
        'Hot AC / Top 40 / CHR',
        'News/Talk',
        'R and B',
        'Rock',
        'Sports',
        'Throwbacks',
        'Urban'
      ]
    },
  },
  methods: {
    async fetchEditorialFeeds() {
       try {
          const apiRequest = `${window.location.protocol}//${window.location.host}/rdc/editorial-group`,
            editorials = await radioApi.get(apiRequest);

          this.stationEditorials = editorials || [];
          this.filteredStationEditorials = editorials || [];
        } catch (e) {

        }
    },

    async submitChanges() {
      const updatedStations = this.stationEditorials.filter(station => station.edited);

      this.stationEditorials.map(station => {
        this.$set(station, 'edited', false);
      });
      this.enableUpdate = false;

      for (const station of updatedStations) {
         try {
          const apiRequest = `${window.location.protocol}//${window.location.host}/rdc/editorial-group/${station.id}`,
            stationsResponse = await radioApi.put(apiRequest, station.data);
        } catch (e) {}
      }
     
    },

    updateFeed(stationId, feed) {
      this.stationEditorials = this.stationEditorials.map((station) => {
        if (station.id === stationId) {
          this.$set(station, 'edited', true);
          station.data.feeds[feed] = !station.data.feeds[feed];
        }
        return station;
      });
      this.enableUpdate = true;
    },
    selectStation(station) {
      if(station) {
        this.filteredStationEditorials = this.stationEditorials.filter(st => st.data.siteSlug.includes(station));
      } else {
        this.filteredStationEditorials = this.stationEditorials
      }
    },
    sortTable(col) {
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
            ? a.data.siteSlug > b.data.siteSlug
            : a.data.feeds[col] > b.data.feeds[col]
        ) {
          return ascending ? 1 : -1;
        } else if (
          col === 'STATION'
            ? a.data.siteSlug < b.data.siteSlug
            : a.data.feeds[col] < b.data.feeds[col]
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
