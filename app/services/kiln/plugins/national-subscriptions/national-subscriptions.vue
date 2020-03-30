<!-- Station Theme Manager -->
<template>
  <div class="national-subscriptions">
    <div class="page-list-headers national-subscriptions__header">
        <span class="national-subscriptions__page-list-headers page-list-header page-list-headers__description">Description</span>
        <span class="national-subscriptions__page-list-headers page-list-header page-list-headers__updated">Last Updated</span>
    </div>
    <div class="page-list-readout">
      <div :key="index"
          v-for="(subscription, index) in subscriptions"
      >
        <div class="page-list-item">
          <h4 class="national-subscriptions__page-list-item__description">{{subscription.short_desc}}</h4>
          <span class="national-subscriptions__page-list-item__updated"><time>{{ subscription.last_updated_utc | localDate }}</time></span>
        </div>
        <div :key="propIndex"
          class="page-list-item"
          v-for="(prop, propIndex) in subscription.filter"
        >
          <dl class="national-subscriptions__page-list-item__filter">
            <dt>{{ propIndex | startCase }}</dt>
            <dd>{{ prop | valList }}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  const moment = require('moment');
  const startCase = require('lodash/startCase');

  export default {
    data() {
      const {
        nationalSubscriptions: subscriptions = [],
        stationForPermissions: { name: stationName }
      } = window.kiln.locals

      return {
        stationName,
        subscriptions
      }
    },
    computed: {},
    methods: {},
    components: {},
    filters: {
      localDate: utcDateStr => moment(utcDateStr).format('MMM Do, YYYY, h:mm:ss a'),
      startCase,
      valList: val => Array.isArray(val) ? val.join(', ') : val
    }
  }
</script>
