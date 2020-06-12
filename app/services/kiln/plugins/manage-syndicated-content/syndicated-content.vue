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
        v-for="(contentItem, contentIndex) in content"
        :key="contentIndex"
        :content="contentItem"
        :stationFilter="stationFilter"
        @createSyndication="openModal"
      ></syndicated-content-row>
      <div class="content-rows__load-more page-list-load-more" v-if="showLoadMore">
        <ui-button type="secondary" class="page-list-load-more-button" @click="performSearch">Load More</ui-button>
      </div>
    </div>
    <ui-modal ref="syndicationModal" title="Content Syndication" class="manage-syndicated-content__modal syndication-modal">
      <template v-if="!stationSectionFronts">
        <p>There are no section fronts available for the selected station. Click on Save to complete the syndication.</p>
      </template>
      <template v-else>
        <h4 class="syndication-modal__title">{{ stationSectionFronts.label }}</h4>
        <ui-select
          :placeholder="'Primary Section Front'"
          :hasSearch="true"
          :options="stationSectionFronts.primaryOptions"
          :value="selectedSectionFronts.primary"
          @input="updateSectionFront('primary', ...arguments)"/>
        <ui-select
          :placeholder="'Secondary Section Front'"
          :hasSearch="true"
          :options="stationSectionFronts.secondaryOptions"
          :value="selectedSectionFronts.secondary"
          @input="updateSectionFront('secondary', ...arguments)"/>
      </template>
      <div class="syndication-modal__buttons">
        <ui-button buttonType="button" @click="saveSyndication" color="green">Save</ui-button>
        <ui-button buttonType="button" @click="closeModal">Close</ui-button>
      </div>
    </ui-modal>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { mapGetters } from 'vuex';
  import stationSelect from '../../shared-vue-components/station-select';
  import StationSelectInput from '../../shared-vue-components/station-select/input.vue';
  import SyndicatedContentRow from './syndicated-content-row.vue';
  import queryService from '../../../client/query';
  import { retrieveList } from '../../../client/lists';
  import { isUrl } from '../../../universal/utils';

  const { UiButton, UiIconButton, UiTextbox, UiModal, UiSelect } = window.kiln.utils.components,
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
        content: [],
        stationFilter: null,
        selectedContentId: null,
        stationSectionFronts: null,
        selectedSectionFronts: {}
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
    watch: {
      selectedStation(newStation) {
        this.stationFilter = newStation;
        this.cleanSearch();
        this.performSearch();
        this.stationFilter
          ? this.loadSectionFronts()
          : this.stationSectionFronts = null;
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
          {
            shouldDedupeContent: false,
            includeIdInResult: true,
            transformResult
          }
        );

        return result;
      },
      performSearch() {
        const offset = this.offset,
          query = this.query,
          stationFilter = this.stationFilter;

        query && stationFilter && this.search().then(({ content, total }) => {
          if (offset === 0) {
            this.content = content;
          } else {
            this.content = this.content.concat(content);
          }

          this.offset = offset + content.length;
          this.total = total;
        });
      },
      filterList: _.debounce(function() {
        this.cleanSearch();
        this.performSearch();
      }, 300),
      cleanSearch() {
        this.offset = 0;
        this.total = 0;
        this.content = [];
      },
      loadSectionFronts() {
        const { slug, name, callsign } = this.stationFilter,
          label = `${name} | ${callsign}`,
          transformSectionFronts = sectionFronts => sectionFronts.map(sf => ({
            label: sf.name,
            value: sf.value
          }));

        Promise.all([
          retrieveList(`${slug}-primary-section-fronts`),
          retrieveList(`${slug}-secondary-section-fronts`),
        ]).then(([primarySectionFronts, secondarySectionFronts]) => {
          this.stationSectionFronts = {
            label,
            primaryOptions: transformSectionFronts(primarySectionFronts),
            secondaryOptions: transformSectionFronts(secondarySectionFronts)
          };
        }).catch(() => {
          this.stationSectionFronts = null;
        });
      },
      updateSectionFront(property, value) {
        this.selectedSectionFronts = { ...this.selectedSectionFronts, [property]: value };
      },
      openModal(contentId) {
        this.selectedContentId = contentId;
        this.selectedSectionFronts = {};
        this.$refs.syndicationModal.open();
      },
      closeModal() {
        this.$refs.syndicationModal.close();
        this.selectedContentId = null;
      },
      saveSyndication() {
        this.closeModal();
      }
    },
    components: {
      UiButton,
      UiIconButton,
      UiTextbox,
      UiModal,
      UiSelect,
      'station-select': StationSelectInput,
      SyndicatedContentRow
    }
  };
</script>