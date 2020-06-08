<!-- AP News Manager -->
<template>
  <div class="ap-news-manager">
    <ui-tabs class="ap-news-manager__tabs" fullwidth @tab-change="changeTab">
      <ui-tab :key="tab.id" :title="tab.title" v-for="tab in tabs">
        <p>
          <em>{{ tab.title }}</em> content should be displayed...         
        </p>
         <!-- 
           /*
            * @TODO: Handle content for upcoming tickets
            * ON-1979 AP News | create/add AUTO-INGEST tab and 
            * ON-1980 AP News | create/add Manual Import tab to AP News
            */ 
          -->
      </ui-tab>
    </ui-tabs>
  </div>
</template>

<script>
const { UiTabs, UiTab } = window.kiln.utils.components;

export default {
  name: "AP News",
  data() {
    return {
      tabs: [
        { id: 1, title: "Auto-Ingest" },
        { id: 2, title: "Manual Article Import" },
      ]
    };
  },
  methods: {
    changeTab(tab){
      /*
      * @TODO: Handle logic for upcoming tickets
      * ON-1979 AP News | create/add AUTO-INGEST tab and 
      * ON-1980 AP News | create/add Manual Import tab to AP News
      */
    }
  },
  components: {
    UiTabs,
    UiTab,
  },
};
</script>
