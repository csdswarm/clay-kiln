<template>
  <div class="national-subscriptions">
    <header>
      <h2 class="title">National Subscriptions</h2>
    </header>
    <table cellspacing="1">
      <thead>
        <tr>
          <th :key="index" v-for="(config, index) in tableHeaders">{{ config.display }}</th>
        </tr>
      </thead>
      <tbody>
        <DataRow
          :key="index"
          v-for="(subscription, index) in subscriptions"
          :data="subscription"
          :rowConfig="rowConfig"
          :isLoading="isLoading"
          @onSaveDataRow="onSaveDataRow"
          @onDeleteDataRow="onDeleteDataRow"
        />
      </tbody>
      <tfoot>
        <DataRow
          :data="newSub"
          :rowConfig="rowConfig"
          :isLoading="isLoading"
          mode="create"
          @onNewDataRow="onNewDataRow"
        />
      </tfoot>
    </table>
  </div>
</template>


<script>
  const { UiButton, UiTextbox, UiIconButton } = window.kiln.utils.components;
  const DataRow = require('./national-subscriptions-row.vue');
  const startCase = require('lodash/startCase');
  const axios = require('axios');
  const tableConfig = [
    {
      key: 'id',
      display: 'id',
      isHeader: false,
      isDataProp: false,
      isEditable: false,
      dataType: Number
    },
    {
      key: 'station_slug',
      display: 'slug',
      isHeader: true,
      isDataProp: true,
      isEditable: false,
      dataType: String
    },
    {
      key: 'short_desc',
      display: 'description',
      isHeader: true,
      isDataProp: true,
      isEditable: true,
      dataType: String
    },
    {
      key: 'last_updated_utc',
      display: 'updated',
      isHeader: true,
      isDataProp: true,
      isEditable: false,
      dataType: Date,
      useFilter: 'formatDate'
    },
    {
      key: 'filter',
      display: 'filter',
      isHeader: true,
      isDataProp: true,
      isEditable: true,
      dataType: Object
    },
    {
      key: 'actions',
      display: 'actions',
      isHeader: true,
      isDataProp: false,
      isEditable: false,
      dataType: null
    }
  ];

  class NationalSubscription {
    constructor(options={
      station_slug: window.kiln.locals.station.site_slug,
      short_desc: '',
      filter: {
        // as currently described in get-national-subscriptions.js
        populateFrom: '', // {string}
        contentType: '', // {string}
        sectionFront: '' ,// {string}
        secondarySectionFront: '', // {string}
        tags: [], // {string[]}
        excludeSectionFronts: [], // {string[]}
        excludeSecondarySectionFronts: [], // {string[]}
        excludeTags: [], // {string[]}
      }
    }) {
      this.id = '#';
      this.last_updated_utc =  'N/A';
      this.station_slug = options.station_slug;
      this.short_desc = options.short_desc;
      this.filter = {...options.filter};
    }
  }

  export default {
    data() {
      const {
        stationForPermissions: { name: stationName }
      } = window.kiln.locals

      return {
        isLoading: false,
        stationName,
        subscriptions: [...window.kiln.locals.nationalSubscriptions],
        newSub: new NationalSubscription()
      }
    },
    methods: {
      showSnack: function(message, duration=4000){
        this.$store.dispatch('showSnackbar', {
            message,
            duration: 4000
        });
      },
      handleError: function(err, duration=4000) {
        console.error(err);
        this.showSnack(`Error: ${err.message}`);
      },
      onCreate() {
        if(!this.newSub.short_desc.trim() || this.isLoading) return;
        this.isLoading = true;
        const newSub = {
          stationSlug: this.newSub.station_slug,
          shortDescription: this.newSub.short_desc,
          filter: {...this.newSub.filter}
        };
        axios.post(`/rdc/national-subscription`, newSub)
          .then(response => {
            this.subscriptions.push(response.data);
            this.newSub.description = '';
            this.showSnack('Subscription Added');
            this.newSub = new NationalSubscription();
          })
          .catch(this.handleError)
          .finally(()=>this.isLoading = false);
      },
      onUpdate(index) {
        this.isLoading = true;
        const sub = this.subscriptions[index];
        const updatedSub = {
          stationSlug: sub.station_slug,
          shortDescription: sub.short_desc,
          filter: sub.filter
        }
        axios.put(`/rdc/national-subscription/${sub.id}`, updatedSub)
          .then(response => {
            this.showSnack('Subscription Updated');
          })
          .catch(this.handleError)
          .finally(()=>this.isLoading = false);
      },
      onDelete(id) {
        this.isLoading = true;
        axios.delete(`/rdc/national-subscription/${id}`)
          .then(response => {
            this.subscriptions = this.subscriptions.filter(sub => sub.id !== id);
            this.showSnack('Subscription Deleted');
          })
          .catch(this.handleError)
          .finally(()=>this.isLoading = false);
      },
      // listeners for emission events on the row(s)
      onNewDataRow(data) {
        this.onCreate();
      },
      onSaveDataRow(data) {
        const index = this.subscriptions.indexOf(data);
        this.onUpdate(index);
      },
      onDeleteDataRow(data) {
        this.onDelete(data.id);
      }
    },
    computed: {
      tableHeaders() {
        return tableConfig.filter(config => config.isHeader);
      },
      rowConfig() {
        return tableConfig.filter(config => config.isDataProp);
      }
    },
    components: {
      UiTextbox,
      UiButton,
      UiIconButton,
      DataRow
    }
  }
</script>

