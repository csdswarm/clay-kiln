<!-- AP News Manager -->
<template>
  <div class="ap-news-manager">
    <ui-tabs class="ap-news-manager__tabs" fullwidth @tab-change="changeTab">
       <ui-tab id="auto" title="Auto Ingest">
        Auto Goes Here!.
      </ui-tab>
      <ui-tab selected id="manual" title="Manual Import">
        <ap-news-manual :entitlements="entitlements"></ap-news-manual>
      </ui-tab>
    </ui-tabs>
  </div>
</template>

<script>
const axios = require('axios');
const { UiTabs, UiTab } = window.kiln.utils.components;
const ApNewsManualImport = require('./ap-news-manual-import.vue');

export default {
  name: "AP News",
  data() {
    return {
      entitlements: [],
    };
  },
  async created() {
    const AP_LIST = '/_lists/ap-media-entitlements';
    try {
      const response = await axios.get(
        AP_LIST
      );
      this.entitlements = response.data;
    } catch (error) {
      console.log('An error ocurred while fetching ap-media-entitlements', error);
    }
  },
  components: {
    UiTabs,
    UiTab,
    'ap-news-manual': ApNewsManualImport,
  },
};
</script>
