<template>
  <div class="national-subscriptions">
    <header>
      <h2 class="title">National Subscriptions</h2>
    </header>
    <table cellspacing="1">
      <thead>
        <tr>
          <th>id</th>
          <th>slug</th>
          <th>description</th>
          <th>updated</th>
          <th>filter</th>
          <th>actions</th>
        </tr>
      </thead>
      <tbody>
        <tr :key="index" v-for="(subscription, index) in subscriptions">
          <td>{{ subscription.id }}</td>
          <td>{{ subscription.station_slug }}</td>
          <td>
            <ui-textbox v-model="subscriptions[index].short_desc"></ui-textbox>
          </td>
          <td>{{ subscription.last_updated_utc | formatDate }}</td>
          <td>{{ subscription.filter }}</td>
          <td>
            <ui-icon-button type="primary" color="default" icon="save" size="small" :loading="isLoading" v-on:click="onUpdate(index)"></ui-icon-button>
            <ui-icon-button type="primary" color="default" icon="delete" size="small" :loading="isLoading"  v-on:click="onDelete(subscription.id)"></ui-icon-button>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2">
            <ui-textbox readonly="true" v-model="newSub.stationSlug"></ui-textbox>
          </td>
          <td colspan="2">
            <ui-textbox placeholder="description" enforceMaxlength="true" maxLength="40" v-model="newSub.shortDescription"></ui-textbox>
          </td>
          <td>{{newSub.filter}}</td>
          <td>
            <ui-button color="primary" icon="add" :loading="isLoading" v-on:click="onCreate">Add</ui-button>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>


<script>
  const { UiButton, UiTextbox, UiIconButton } = window.kiln.utils.components;
  const moment = require('moment');
  const startCase = require('lodash/startCase');
  const axios = require('axios');

  class NationalSubscription {
    constructor(options={
      stationSlug: window.kiln.locals.station.slug,
      shortDescription: '',
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
      this.stationSlug = options.stationSlug;
      this.shortDescription = options.shortDescription;
      this.filter = options.filter;
    }
    static getFilters() {
      return Object.entries(new NationalSubscription().filter).map(arr => arr[0])
    }
  }

  console.log(new NationalSubscription())
  console.log(NationalSubscription.getFilters())

  export default {
    data() {
      const {
        nationalSubscriptions: subscriptions = [],
        stationForPermissions: { name: stationName }
      } = window.kiln.locals

      return {
        isLoading: false,
        stationName,
        subscriptions: subscriptions.sort((a,b)=>a.id<b.id ? -1: 1),
        newSub: new NationalSubscription()
      }
    },
    computed: {},
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
      onCreate: function() {
        if(!this.newSub.shortDescription.trim()) return;
        const newSub = {
          stationSlug: this.newSub.stationSlug,
          shortDescription: this.newSub.shortDescription,
          filter: this.newSub.filter
        };
        axios.post(`/rdc/national-subscription`, newSub)
          .then(response => {
            this.subscriptions.push(response.data);
            this.newSub.description = '';
            this.showSnack('Subscription Added');
          })
          .catch(this.handleError)
      },
      onUpdate(index) {
        this.isLoading = true;
        const sub = this.subscriptions[index];
        const updatedSub = {
          stationSlug: sub.station_slug,
          shortDescription: sub.short_desc,
          filter: sub.filter
        }
        console.log(this.subscriptions[index]);
        axios.put(`/rdc/national-subscription/${sub.id}`, updatedSub)
          .then(response => {
            this.showSnack('Subscription Updated');
          })
          .catch(this.handleError)
          .finally(()=>this.isLoading = false);
      },
      onDelete: function(id){
        this.isLoading = true;
        console.log(`Deleting subscription:id:${id}`);
        axios.delete(`/rdc/national-subscription/${id}`)
          .then(response => {
            this.subscriptions = this.subscriptions.filter(sub => sub.id !== id);
            this.showSnack('Subscription Deleted');
          })
          .catch(this.handleError)
          .finally(()=>this.isLoading = false);
      }
    },
    components: {
      UiTextbox,
      UiButton,
      UiIconButton
    },
    filters: {
      formatDate: utcDateStr => moment(utcDateStr).fromNow(),
      startCase,
      valList: val => Array.isArray(val) ? val.join(', ') : val
    }
  }
</script>

