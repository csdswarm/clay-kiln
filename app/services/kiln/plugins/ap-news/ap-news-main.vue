<!-- AP News Manager -->
<template>
  <div class="ap-news-manager">
    <ui-tabs class="ap-news-manager__tabs" fullwidth>
      <ui-tab :key="tab.id" :title="tab.title" v-for="tab in tabs">
        <p>
          <em>{{ tab.title }}</em> content should be displayed...         
        </p>
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
  components: {
    UiTabs,
    UiTab,
  },
};
</script>
