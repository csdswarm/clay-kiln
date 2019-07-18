<!--  Brightcove Search -->
<docs>
    # Article/Gallery Search
</docs>
<template>
    <div class="content-search">
        <ui-textbox
                floating-label
                :label="schema._label"
                name="content-search"
                help="Keyword search articles/galleries or paste in a URL"
                @input="inputOnchange"
                v-model="query"
        ></ui-textbox>
        <div v-if="showResults" class="content-search__search-results">
            <ul v-if="!loading">
                <li class="search-results__header">
                    <div>Headline</div><div>Published</div>
                </li>
                <li v-for="result in searchResults"
                    :key="result.canonicalUrl"
                    class="search-results__item"
                    @click="selectItem(result)">
                    <div class="item__header">{{ result.seoHeadline }}</div>
                    <div class="item__date">{{ result.date }}</div>
                </li>
            </ul>
            <ui-progress-circular v-show="loading"></ui-progress-circular>
        </div>
    </div>
</template>
<script>

  import axios from 'axios';
  import _debounce from 'lodash/debounce';
  import { kilnDateTimeFormat } from '../../../../services/universal/dateTime';

  const UiButton = window.kiln.utils.components.UiButton;
  const UiProgressCircular = window.kiln.utils.components.UiProgressCircular;
  const UiTextbox = window.kiln.utils.components.UiTextbox;

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        searchResults: [],
        loading: false,
        query: this.data || ''
      };
    },
    computed: {
      params: function () {
        return this.query;
      },
      showResults: function () {
        return this.loading || this.searchResults.length !== 0;
      }
    },
    /**
     * lifecycle method that will populate the results from an existing url or display the most recent 10 items published
     */
    created() {
        this.performSearch();
    },
    methods: {
      /**
       * creates the elasticsearch query
       *
       * @param {String} query
       * @returns {Object}
       */
      createElasticsearchQuery(query) {
        return  {
          "index": "published-content",
          "body": {
            "size": 10,
            "from": 0,
            "sort": {
              "date": {
                "order": "desc"
              }
            },
            "query": {
              "query_string": {
                "query": `*${query.replace(/([\/|:])/g, '\\$1')}*`,
                "fields": [
                  "authors",
                  "canonicalUrl",
                  "tags",
                  "teaser"
                ]
              }
            },
            "_source": [
              "date",
              "canonicalUrl",
              "seoHeadline"
            ]
          }
        };
      },
      /**
       *  makes a call to the endpoint and populates the results
       */
      async performSearch() {
        this.loading = true;

        try {
          // if there are no search params yet, pass in * to get the top 10 most recent
          const response = await axios.post('/_search', this.createElasticsearchQuery(this.params || '*'));

          // format the date using the same format as clay-kiln
          this.searchResults = response.data.hits.hits.map(item =>
            ({ ...item._source, date: kilnDateTimeFormat(item._source.date) }));
          this.loading = false;
        } catch (e) {
          this.searchResults = [];
          this.loading = false;
        }
      },
      /**
       * performs a search a debounced search
       */
      debouncePerformSearch: _debounce(function() { this.performSearch(); }, 1000),
      /**
       * determines if the search should take place based on the current input
       */
      inputOnchange() {
        if (this.params === '' || this.params.length > 2) {
          this.debouncePerformSearch();
        } else {
          // if there are less than two, just take already exists and see if it can reduce the results
          this.searchResults = this.searchResults.filter(item =>
            item.canonicalUrl.includes(this.params) || item.seoHeadline.includes(this.params));
        }
      },
      /**
       *
       * @param selected
       */
      selectItem(selected) {
        this.query = selected.canonicalUrl;
        this.searchResults = this.searchResults.filter(item => item.canonicalUrl === selected.canonicalUrl);
        this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.query })
      }
    },
    components: {
      UiButton,
      UiProgressCircular,
      UiTextbox
    }
  }
</script>


