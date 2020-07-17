<!-- AP News Manager -->
<template>
  <div class="ap-news-manager">
    <ui-tabs class="ap-news-manager__tabs" fullwidth @tab-change="changeTab">
       <ui-tab id="auto" title="Auto Ingest" v-if="hasAccessAutoIngestPermission">
        <ApNewsAutoIngest/>
      </ui-tab>
      <ui-tab selected id="manual" title="Manual Import">
        <ap-news-manual :entitlements="entitlements"></ap-news-manual>
      </ui-tab>
    </ui-tabs>
  </div>
</template>

<script>
const axios = require('axios');
const { unityAppDomainName: unityApp } = require('../../../universal/urps');
const { UiTabs, UiTab } = window.kiln.utils.components;
const ApNewsManualImport = require('./ap-news-manual-import.vue');
const ApNewsAutoIngest = require('./ap-news-auto-ingest.vue');

export default {
  name: "AP News",
  data() {
    return {
      entitlements: [],
    };
  },
  computed: {
    hasAccessAutoIngestPermission(){
      const { user } = kiln.locals;
      return user.can('access').the('ap-news-auto-ingest').for(unityApp).value 
    }
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
    ApNewsAutoIngest,
  },
};
</script>
