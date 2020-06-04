<template>
  <div class="manage-syndicated-content">
    <div class="manage-syndicated-content__options page-list-controls">
      <div class="page-list-controls__column filters">
        <ui-textbox
          class="filters__search"
          v-model.trim="query"
          type="search"
          autofocus
          placeholder="Search by Title or URL"
          @input="filterList"
        ></ui-textbox>
        <station-select
          class="filters__station-select"
          allowClear="false"
          :onChange="stationChanged"
        />
      </div>
    </div>
    <div class="manage-syndicated-content__headers page-list-headers">
      <span class="page-list-header page-list-headers__title">Title</span>
      <span class="page-list-header page-list-headers__station">Station</span>
      <span class="page-list-header page-list-headers__status">Status</span>
      <span class="page-list-header page-list-headers__manage">Manage</span>
    </div>
    <div class="manage-syndicated-content__rows page-list-readout">
      <syndicated-content-row
        v-for="(page, pageIndex) in pages"
        :key="pageIndex"
        :page="page"
        :stationFilter="selectedStation"
      ></syndicated-content-row>
      <div class="content-rows__load-more page-list-load-more" v-if="showLoadMore">
        <ui-button type="secondary" class="page-list-load-more-button" @click="performSearch">Load More</ui-button>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { mapGetters } from 'vuex';
  import stationSelect from '../../shared-vue-components/station-select';
  import StationSelectInput from '../../shared-vue-components/station-select/input.vue';
  import SyndicatedContentRow from './syndicated-content-row.vue';
  import queryService from '../../../client/query';
  import { isUrl } from '../../../universal/utils';

  const { UiButton, UiIconButton, UiTextbox } = window.kiln.utils.components,
    { locals } = window.kiln,
    INDEX = 'published-content',
    CONTENT_TYPES = [
      'article',
      'gallery'
    ],
    ELASTIC_FIELDS = [
      'authors',
      'date',
      'dateModified',
      'pageUri',
      'pageTitle',
      'canonicalUrl',
      'contentType',
      'site',
      'stationName',
      'stationSlug',
      'stationSyndication',
      'syndicationStatus'
    ],
    DEFAULT_QUERY_SIZE = 50;

  export default {
    data() {
      return {
        query: '',
        offset: 0,
        total: null,
        pages: []
      };
    },
    computed: {
      ...mapGetters(stationSelect.storeNs, ['selectedStation']),
      showLoadMore() {
        return this.offset < this.total;
      },
      queryText() {
        return this.query.replace(/user:\S+/i, '').trim();
      }
    },
    methods: {
      async search() {
        const { sanitizeSearchTerm } = queryService,
          query = queryService.newQueryWithCount(INDEX, DEFAULT_QUERY_SIZE, locals),
          searchString = this.queryText.replace(/^https?:\/\//, ''),
          host = isUrl(this.queryText) ? searchString.split('/')[0] : '',
          transformResult = (formattedResult, rawResult) => ({ content: formattedResult, total: _.get(rawResult, 'hits.total') });

        queryService.addSort(query, { dateModified: { order: 'desc'} });
        queryService.addOffset(query, this.offset);
        queryService.onlyWithTheseFields(query, ELASTIC_FIELDS);

        const searchCondition = {
          bool: {
	          should: [
              {
                query_string: {
                  query: sanitizeSearchTerm(`*${ searchString }*`),
                  fields: ['authors', 'canonicalUrl'],
                }
              }
            ],
            minimum_should_match: 1
          }
        }

        /*
          If entered query is an url, we remove the host part so that
          we can search for a match in syndicatedArticleSlug field
        */
        if (host) {
          searchCondition.bool.should.push({
            nested: {
              path: 'stationSyndication',
              query: {
                match: {
                  'stationSyndication.syndicatedArticleSlug': {
                    query: searchString.replace(host, ''),
                    operator: "and"
                  }
                }
              }
            }
          });
        }

        queryService.addMust(query, searchCondition);

        const result = await queryService.searchByQuery(
          query,
          locals,
          { shouldDedupeContent: true, transformResult }
        );

        return result;
      },
      performSearch() {
        const offset = this.offset,
          query = this.query;

        query && this.search().then(({ content: pages, total }) => {
          if (offset === 0) {
            this.pages = pages;
          } else {
            this.pages = this.pages.concat(pages);
          }

          this.offset = offset + pages.length;
          this.total = total;
        });
      },
      filterList: _.debounce(function() {
        this.cleanSearch();
        this.performSearch();
      }, 300),
      stationChanged() {
        this.cleanSearch();
        this.performSearch();
      },
      cleanSearch() {
        this.offset = 0;
        this.total = 0;
        this.pages = [];
      }
    },
    components: {
      UiButton,
      UiIconButton,
      UiTextbox,
      'station-select': StationSelectInput,
      SyndicatedContentRow
    }
  };
</script>