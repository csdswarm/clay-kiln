<!--  Content Search -->
<docs>
    # Content Search
</docs>
<template>
    <div class="content-search">
        <ui-textbox
                floating-label
                :label="schema._label"
                name="content-search"
                :help="
                  'Keyword search content or paste in a URL. ' +
                  (args.help || '')
                "
                @input="inputOnchange"
                v-model="searchText"
        ></ui-textbox>
        <div v-if="showResults" class="content-search__search-results search-results">
            <ul v-if="!loading">
                <li class="search-results__header">
                    <div>Headline</div><div>Published</div>
                </li>
                <li v-for="result in searchResults"
                    :key="result.canonicalUrl"
                    class="search-results__item"
                    @click="selectItem(result)">
                    <div class="search-results__headline">{{ result.seoHeadline }}</div>
                    <div class="search-results__date">{{ result.date }}</div>
                </li>
            </ul>
            <ui-progress-circular v-show="loading"></ui-progress-circular>
        </div>
    </div>
</template>
<script>

  import _ from 'lodash';
  import _debounce from 'lodash/debounce';
  import axios from 'axios';
  import queryService from '../../../client/query';
  import { isUrl } from '../../../../services/universal/utils';
  import { kilnDateTimeFormat } from '../../../../services/universal/dateTime';
  import { DEFAULT_STATION } from '../../../../services/universal/constants';

  const { UiButton, UiTextbox }  = window.kiln.utils.components;
  const UiProgressCircular = window.kiln.utils.components.UiProgressCircular;
  const { sanitizeSearchTerm } = queryService;
  const nationalStationSlug = DEFAULT_STATION.site_slug;
  // this query says
  //   "match if stationSlug doesn't exist or it's an empty slug"
  //   currently I think national stations shouldn't have a stationSlug, but
  //   because I'm setting stationSlug to an empty string as a national slug
  //   identifier, I wanted to make sure we checked that as well.
  const matchNationalStation = [
    {
      bool: {
        must_not: { exists: { field: "stationSlug" } }
      }
    },
    { match: { stationSlug: nationalStationSlug } }
  ];

  /**
   * returns an array which will be put into an elasticsearch `should` array
   *   meant to match any station we have access to.
   *
   * I'm pretty sure this needs to be a function because window.kiln.locals is
   *
   * @returns {object}
   */
  const getMatchStationsIHaveAccessTo = () => {
    const { locals } = window.kiln;

    const matchStations = _.chain(locals.stationsIHaveAccessTo)
      // omit the national
      .omit(nationalStationSlug)
      .map(station => ({ match: { stationSlug: station.slug } }))
      .value();

    if (locals.stationsIHaveAccessTo[nationalStationSlug]) {
      matchStations.push(...matchNationalStation)
    }

    return matchStations;
  };

  const matchStationsIHaveAccessTo = getMatchStationsIHaveAccessTo();

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        searchResults: [],
        loading: false,
        searchText: this.data || ''
      };
    },
    watch: {
      data(val) {
        this.searchText = val || '';
        this.performSearch();
      }
    },
    computed: {
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
      commitFormData() {
          this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.searchText });
      },
      /**
       * search the published_content index the search string
       *
       * @returns {array}
       */
      async search() {
        const { locals } = window.kiln,
          query = queryService('published-content', locals),
          // if there are no search text yet, pass in * to get the top 10 most recent
          searchString = this.searchText || '*';

        queryService.addSize(query, 10);
        queryService.onlyWithTheseFields(query, ['date', 'canonicalUrl', 'seoHeadline']);
        queryService.addFilter(query, {
          bool: {
            must: [{
              query_string: {
                query: sanitizeSearchTerm(`*${ searchString.replace(/^https?:\/\//, '') }*`),
                fields: ["authors", "canonicalUrl", "tags", "teaser"]
              }
            }],
            should: matchStationsIHaveAccessTo
          }
        });
        queryService.addSort(query, { date: { order: 'desc'} });

        const results = await queryService.searchByQuery(
          query,
          locals,
          { shouldDedupeContent: false }
        );

        // format the date using the same format as clay-kiln
        return results.map(item => ({ ...item, date: kilnDateTimeFormat(item.date) }));
      },
      /**
       *  makes a call to the endpoint and populates the results
       */
      async performSearch() {
        this.loading = true;

        try {
          this.searchResults = await this.search();
        } catch (e) {
          console.error(e);
          this.searchResults = [];
        }

        this.loading = false;
        if (!this.searchResults.length) {
            this.commitFormData();
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
        if (this.searchTextparams === '' || !this.searchText || this.searchText.length > 2) {
          if(isUrl(this.searchText)){
              this.commitFormData();
          }
          this.debouncePerformSearch();
        } else {
          // if there are less than two, just take already exists and see if it can reduce the results
          this.searchResults = this.searchResults.filter(item =>
            item.canonicalUrl.includes(this.searchText) || item.seoHeadline.includes(this.searchText));
        }
      },
      /**
       *
       * @param selected
       */
      selectItem(selected) {
        this.searchText = selected.canonicalUrl;
        this.searchResults = [selected];
        this.commitFormData();
      }
    },
    components: {
      UiButton,
      UiProgressCircular,
      UiTextbox
    }
  }
</script>
