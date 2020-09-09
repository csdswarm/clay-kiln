<template>
  <div class="page-list">
    <div class="page-list-controls">
      <div class="page-list-controls__column">
        <ui-textbox class="page-list-search" v-model.trim="query" type="search" autofocus placeholder="Search by Title or Byline" @input="filterList"></ui-textbox>
        <station-select class="page-list-override__station-select" allowClear="true" :onChange="stationChanged"/>
      </div>
      <ui-icon-button class="page-list-status-small" type="secondary" icon="filter_list" has-dropdown ref="statusDropdown" @dropdown-open="onPopoverOpen" @dropdown-close="onPopoverClose">
        <status-selector slot="dropdown" :selectedStatus="selectedStatus" :vertical="true" @select="selectStatus"></status-selector>
      </ui-icon-button>
      <status-selector class="page-list-status-large" :selectedStatus="selectedStatus" @select="selectStatus"></status-selector>
    </div>
    <div class="page-list-headers">
      <span class="page-list-header page-list-header-title">Title</span>
      <span class="page-list-header page-list-header-byline">Byline</span>
      <span class="page-list-header page-list-header-status">Status</span>
      <span class="page-list-header page-list-override__header-source">Source</span>
      <span class="page-list-header page-list-header-collaborators">Collaborators</span>
    </div>
    <div class="page-list-readout">
      <page-list-item
        v-for="(page, pageIndex) in pages"
        :key="pageIndex"
        :page="page"
        :isPopoverOpen="isPopoverOpen"
        :stationFilter="selectedStation"
        @setQuery="setQuery"
        @setStatus="selectStatus"></page-list-item>
      <div class="page-list-load-more" v-if="showLoadMore">
        <ui-button type="secondary" class="page-list-load-more-button" @click="fetchPages">Load More</ui-button>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import axios from 'axios';
  import { DEFAULT_STATION } from '../../../universal/constants';
  import { mapGetters } from 'vuex';
  import { filterMainStation, syndicatedStationFilter } from '../../../universal/recirc/recirculation';
  import stationSelect from '../../shared-vue-components/station-select';
  import StationSelectInput from '../../shared-vue-components/station-select/input.vue';
  import statusSelector from './status-selector.vue';
  import pageListItem from './page-list-item.vue';

  const { searchRoute } = window.kiln.utils.references,
    { UiButton, UiIconButton, UiTextbox } = window.kiln.utils.components,
    { uriToUrl } = window.kiln.utils.urls,

    DEFAULT_QUERY_SIZE = 50,

    /****** HELPER METHODS TO BUILD ES QUERY ******/

    /**
     * return match condition for my pages and user searches
     * @param {boolean} isMyPages
     * @param {string} queryUser
     * @param {string} username
     * @return {object}
     */
    buildUsernameFilter = (isMyPages, username, queryUser) => {
      if (!isMyPages && !queryUser) {
        return;
      }

      return {
        nested: {
          path: 'users',
          query: {
            terms: { 'users.username': [username, queryUser].filter(Boolean) }
          }
        }
      };
    },
    /**
     * return match condition for search query text
     * @param {string} queryText
     * @return {object}
     */
    buildSearchFilter = (queryText) => {
      if (queryText) {
        return {
          multi_match: {
            query: queryText,
            fields: ['authors^2', 'title'], // favor authors, then title
            type: 'phrase_prefix'
          }
        };
      }
    },
    /**
     * return match condition for station(s) selected
     * @param {object} stationFilter
     * @param {boolean} hasNationalStationAccess
     * @param {array} stations
     * @return {object}
     */
    buildStationFilter = (stationFilter, hasNationalStationAccess, stations) => {
      let matchStation;

      if (stationFilter) {
        matchStation = filterMainStation(stationFilter.slug);
        matchStation.bool.should.push(syndicatedStationFilter(stationFilter.slug));
      } else {
        matchStation = { bool: { should: matchAllStations(hasNationalStationAccess, stations), minimum_should_match: 1 }};
      }

      return matchStation;
    },
    /**
     * return match condition for all stations assigned to the current user
     * @param {boolean} hasNationalStationAccess
     * @param {array} stations
     * @return {array}
     */
    matchAllStations = (hasNationalStationAccess, stations) => {
      return [
        { terms: { stationSlug: stations } },
        hasNationalStationAccess && {
          bool: {
            must_not: {
              exists: {
                field: 'stationSlug'
              }
            }
          }
        }
      ].filter(Boolean);
    },
    /**
     * update the query object according to the filtered status
     * @param {object} query
     * @param {object} statusFilter
     * @return {void}
     */
    buildStatusFilter = (query, statusFilter) => {
      // when the 'all' status is selected, it allows draft, published, and scheduled pages
      // (but NOT archived)
      if (statusFilter === 'all') {
        query.body.query.bool.must.push({
          term: { archived: false }
        });
      } else if (statusFilter === 'draft') {
        query.body.query.bool.must.push({
          term: { published: false }
        }, {
          term: { archived: false } // only drafts can be archived, but we need to explicitly NOT include archived pages when looking at drafts in the list
        });

        query.body.query.bool.should = [];
        // look for either explicitly not scheduled pages or pages where scheduled is not set at all
        query.body.query.bool.should.push({
          term: { scheduled: false }
        });
        query.body.query.bool.should.push({
          bool: {
            must_not: {
              exists: {
                field: 'scheduled'
              }
            }
          }
        });
        query.body.query.bool.minimum_should_match = 1;
      } else if (statusFilter === 'published') {
        query.body.query.bool.must.push({
          term: { published: true }
        });
        // also sort by last published timestamp
        query.body.sort = {
          publishTime: { order: 'desc' }
        };
      } else if (statusFilter === 'scheduled') {
        query.body.query.bool.must.push({
          term: { scheduled: true }
        });
        // also sort by last scheduled time
        query.body.sort = {
          scheduledTime: { order: 'desc' }
        };
      } else if (statusFilter === 'archived') {
        query.body.query.bool.must.push({
          term: { archived: true }
        });
      }
    },
    /**
     * build the query to send to elastic
     * @param {string} queryText
     * @param {string} queryUser
     * @param {number} offset
     * @param {object} statusFilter
     * @param {boolean} isMyPages
     * @param {string} username
     * @param {boolean} hasNationalStationAccess
     * @param {object} statusFilter
     * @param {array} stations
     * @return {object}
     */
    buildQuery = ({ queryText, queryUser, offset, statusFilter, isMyPages, username, hasNationalStationAccess, stationFilter, stations }) => { // eslint-disable-line
      const query = {
          index: 'pages',
          body: {
            size: DEFAULT_QUERY_SIZE,
            from: offset,
            sort: {
              updateTime: {
                order: 'desc'
              }
            },
            query: {}
          }
        },
        filterByUser = buildUsernameFilter(isMyPages, username, queryUser),
        filterBySearch = buildSearchFilter(queryText),
        filterByStation = buildStationFilter(stationFilter, hasNationalStationAccess, stations);

      _.set(query, 'body.query.bool.must', []);

      filterByUser && query.body.query.bool.must.push(filterByUser);
      filterBySearch && query.body.query.bool.must.push(filterBySearch);
      query.body.query.bool.must.push(filterByStation);
      buildStatusFilter(query, statusFilter);

      return query;
    };


  export default {
    props: ['isMyPages'],
    data() {
      return {
        query: _.get(this.$store, 'state.url.query', ''),
        offset: 0,
        total: null,
        pages: [],
        selectedStatus: _.get(this.$store, 'state.url.status', 'all'),
        isPopoverOpen: false,
        stations: Object.keys(window.kiln.locals.stationsIHaveAccessTo)
      };
    },
    computed: Object.assign(
      {},
      mapGetters(stationSelect.storeNs, ['selectedStation']),
      {
        showLoadMore() {
          return this.total === null || this.offset < this.total;
        },
        queryText() {
          return this.query.replace(/user:\S+/i, '').trim();
        },
        queryUser() {
          const user = this.query.match(/user:(\S+)/i);

          return user ? user[1] : '';
        }
      }
    ),
    methods: {
      onPopoverOpen() {
        this.isPopoverOpen = true;
      },
      onPopoverClose() {
        this.isPopoverOpen = false;
      },
      filterList: _.debounce(function () {
        this.$store.commit('FILTER_PAGELIST_SEARCH', this.query);
        this.offset = 0;
        this.fetchPages();
      }, 300),
      selectStatus(status) {
        this.selectedStatus = status;

        this.$store.commit('FILTER_PAGELIST_STATUS', this.selectedStatus);
        this.offset = 0;
        this.fetchPages();
      },
      setQuery(query) {
        this.query = query;
        this.offset = 0;
        this.fetchPages();
      },
      stationChanged() {
        this.offset = 0;
        this.fetchPages();
      },
      fetchPages() {
        const queryText = this.queryText,
          queryUser = this.queryUser,
          offset = this.offset,
          prefix = _.get(this.$store, 'state.site.prefix'),
          isMyPages = this.isMyPages,
          username = _.get(this.$store, 'state.user.username'),
          stationFilter = this.selectedStation,
          statusFilter = this.selectedStatus,
          stations = this.stations,
          hasNationalStationAccess = stations.includes(''),
          query = buildQuery({
            queryText, queryUser, offset, statusFilter, isMyPages, username, hasNationalStationAccess, stationFilter, stations
          });
        
        return axios({ 
            method: 'post', 
            url: uriToUrl(prefix + searchRoute), 
            data: query, 
            withCredentials: true
          }).then((res) => {
          const hits = _.get(res, 'data.hits.hits') || [],
            total = _.get(res, 'data.hits.total'),
            pages = _.map(hits, hit => Object.assign({}, hit._source, { uri: hit._id }));

          if (offset === 0) {
            this.pages = pages;
          } else {
            this.pages = this.pages.concat(pages);
          }

          this.offset = offset + pages.length;
          this.total = total; // update the total for this particular query
          // (it's used to hide the "load more" button)

          // set the url hash
          if (_.get(this.$store, 'state.ui.currentDrawer')) {
            this.$store.dispatch('setHash', {
              menu: {
                tab: isMyPages ? 'my-pages' : 'all-pages',
                status: statusFilter,
                query: this.query
              }
            });
          }
        });
      }
    },
    mounted() {
      this.fetchPages();
    },
    activated() {
      this.offset = 0;
      this.fetchPages();
    },
    components: {
      UiButton,
      UiIconButton,
      UiTextbox,
      'status-selector': statusSelector,
      'page-list-item': pageListItem,
      'station-select': StationSelectInput
    }
  };
</script>
