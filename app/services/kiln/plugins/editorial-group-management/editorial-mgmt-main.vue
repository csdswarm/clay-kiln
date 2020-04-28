<template>
  <div class="editorial-mgmt__wrapper">
    <h2 class="editorial-mgmt__main-title">Subscriptions</h2>
    <div class="editorial-mgmt__buttons">
      <ui-button @click="addStation">Add Station</ui-button>
    </div>
    <table class="editorial-mgmt-table">
      <thead class="editorial-mgmt-table__head">
        <tr>
          <th
            nowrap
            class="editorial-mgmt-table__title"
            v-for="(col, index) in columns"
            :key="index"
            v-on:click="sortTable(col)"
          >
            {{ col }}
          </th>
        </tr>
      </thead>
      <tbody class="editorial-mgmt-table__body">
        <tr v-for="station in stationEditorials" :key="station.id">
          <td class="editorial-mgmt-table__item"> {{ station.callsign }} </td>
          <td class="editorial-mgmt-table__item" v-for="(val, name, index) in station.feeds" :key="index">
            <ui-checkbox :model="val" :value="val" />
          </td>
          <td class="editorial-mgmt-table__item">
            <ui-button color="red" @click="deleteStation(station)">Delete</ui-button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script>
'use strict';

const radioApi = require('../../../../services/client/radioApi'),
  { editorials, newStationFeed } = require('./data');

const { UiButton, UiCheckbox } = window.kiln.utils.components;

export default {
  name: 'EditorialManagement',
  data: function() {
    return {
      ascendable: false,
      sortColumn: '',
      stationEditorials: [],
      editorialFeedsTitles: []
    };
  },
  components: {
    UiButton,
    UiCheckbox
  }, 
  computed: {
    columns: function() {
      return ['station', ...this.editorialFeedsTitles, ''];
    }
  },
  methods: {
    fetchEditorialList: async function() {
      try {
        const { origin } = window.location;
        const apiRequest = `${origin}/_lists/freq_editorial_feeds`,
          editorials = await radioApi.get(apiRequest);

          this.editorialFeedsTitles = editorials;
          console.log('Editorial fetched')
      } catch (err) {
        console.log('Something went wrong!', err);
      }
    },

    fetchStationsEditorials: async function(){
      // TODO: Connect with backend API endpoint.
      this.stationEditorials = editorials;
      console.log(this.stationEditorials);
    },

    addStation: function(){
      this.stationEditorials.push([{
        id: Math.random(),
        text: 'This is a random station'
      }]);
      console.log('A new station was added but not saved', this.stationEditorials);
    },

    deleteStation: function(station){
      console.log('Attempting to remove an element....')
      this.stationEditorials = this.stationEditorials.filter((elem, index) => {
        if(station.id === elem.id) {
          return false
        }
        return elem;
      })
    },
  },
  mounted() {
    console.log('Fetching editorial feeds available...');
    this.fetchEditorialList();
    console.log('Fetching Saved Information...');
    this.fetchStationsEditorials();
    
  }
};
</script>
