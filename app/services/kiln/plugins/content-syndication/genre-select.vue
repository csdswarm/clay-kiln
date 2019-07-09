<!-- Genre(s) Select-->
<docs>
  # Genre(s) Select
</docs>
<template>
  <div class="genre-select">
    <div v-if="genreOptions && genreOptions.length">
      <ui-select
        :placeholder="'Select Genre(s)'"
        :hasSearch="true"
        :help="'Select genre(s) to syndicate out to. You may search within the dropdown as well.'"
        :multiple="true"
        :options="genreOptions"
        :value="value"
        @input="updateSelectedGenre"
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
          selectedGenre: this.data,
          genreOptions: null
        };
      },
      mounted () {
        this.populateGenres();
      },
      computed: {
        value() {
          return this.selectedGenre || [];
        },
      },
      methods: {
        /**
         *  This function is called when the component is mounted
         *  It queries the api.radio.com for station genres and sets them as selectable.
         */
        async populateGenres() {
          try {
            const apiRequest = 'https://api.radio.com/v1/genres?page[size]=100&sort=name',
              genresResponse = await radioApi.get(apiRequest);

            if (genresResponse) {
              this.genreOptions = genresResponse.data.map(genre => {
                return genre.attributes.name;
              });
            }
          } catch (e) {}
        },
        /**
         * This function is called when a genre is selected from the dropdown.
         * Sets it as currently selected.
         * @param {Object} input
         */
        updateSelectedGenre(input) {
          try {
            this.selectedGenre = input;
            this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.selectedGenre })
          } catch (e) {}
        },
    },
    components: {
      UiSelect
    }
  }
</script>
