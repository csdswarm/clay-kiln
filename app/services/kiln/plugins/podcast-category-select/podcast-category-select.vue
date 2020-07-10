<!-- Podcast Category Select-->
<docs>
  # Podcast Category Select
</docs>
<template>
  <div class="podcast-category-select">
    <div v-if="categoryOptions && categoryOptions.length">
      <ui-select
        label="Podcast Category"
        placeholder="Select a category"
        :floatingLabel="true"
        :search="true"
        :options="categoryOptions"
        :storeRawData="true"
        :value="value"
        @input="updateSelectedCategory"
        @keydown-enter="closeFormOnEnter"
      >
      </ui-select>
    </div>
  </div>
</template>
<script>
  const radioApi = require('../../../client/radioApi');
  const utils = require('../../../../services/universal/podcast');
  const UiSelect = window.kiln.utils.components.UiSelect;

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
          cachedResults: {},
          selectedCategory: this.data,
          categoryOptions: null
      };
    },
    mounted () {
      this.populatePodcastCategories()
    },
    computed: {
      value() {
        return this.selectedCategory || { label: 'Select podcast category...'  }
      },
    },
    methods: {
      /**
       *  This function is both called when the component is mounted
       *  It queries api.radio.com for podcasts categories and sets them as selectable.
       */
      populatePodcastCategories() {
        const self = this;
        if (self.cachedResults) {
          self.categoryOptions = self.cachedResults;
        }
        radioApi.get('https://api.radio.com/v1/categories')
          .then(categoriesResponse => {
            self.categoryOptions = categoriesResponse.data.map(category => {
              return {
                label: category.attributes.name,
                id: category.id,
                name: category.attributes.name,
                slug: category.attributes.slug
              }
            });
            self.cachedResults = self.categoryOptions;
          })
          .catch(e => {
            console.error('error getting podcast data from api', e);
          })
      },

      /**
       *  This function is called when a podcast category is selected from the dropdown.
       *  Sets it as currently selected.
       */
      updateSelectedCategory(input) {
        this.selectedCategory = input;
        this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.selectedCategory })
      },
    },
    components: {
      UiSelect
    }
  }
</script>
