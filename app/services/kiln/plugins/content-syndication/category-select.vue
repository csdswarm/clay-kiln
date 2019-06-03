<!-- Categor(ies) Select-->
<docs>
  # Categor(ies) Select
</docs>
<template>
  <div class="category-select">
    <div v-if="categoryOptions && categoryOptions.length">
      <ui-select
        :placeholder="'Select Categor(ies)'"
        :hasSearch="true"
        :help="'Select categor(ies) to syndicate out to'"
        :multiple="true"
        :options="categoryOptions"
        :value="value"
        @input="updateSelectedCategory"
      >
      </ui-select>
    </div>
  </div>
</template>
<script>
  const radioApi = require('../../../../services/client/radioApi'),
    UiSelect = window.kiln.utils.components.UiSelect;

  export default {
      props: ['name', 'data', 'schema', 'args'],
      data() {
        return {
          selectedCategory: this.data,
          categoryOptions: null
        };
      },
      mounted () {
        this.populateCategories();
      },
      computed: {
        value() {
          return this.selectedCategory || [];
        },
      },
      methods: {
        /**
         *  This function is called when the component is mounted
         *  It queries the api.radio.com for station categories and sets them as selectable.
         */
        async populateCategories() {
          try {
            let apiRequest = 'https://api.radio.com/v1/categories?page[size]=100&sort=name';
            const categoriesResponse = await radioApi.get(apiRequest);

            if (categoriesResponse) {
              this.categoryOptions = categoriesResponse.data.map(category => {
                return category.attributes.name;
              });
            }
          } catch (e) {
            console.log(e);
          }
        },
        /**
         * This function is called when a category is selected from the dropdown.
         * Sets it as currently selected.
         * @param {Object} input
         */
        updateSelectedCategory(input) {
          console.log('update selected category');
          try {
            this.selectedCategory = input;
            this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.selectedCategory })
          } catch (e) {
            console.log("error updating selection: ", e);
          }
        },
    },
    components: {
      UiSelect
    }
  }
</script>
