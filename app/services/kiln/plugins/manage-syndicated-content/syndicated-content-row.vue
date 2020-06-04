<template>
  <div class="syndicated-content-row page-list-item">
    <a
      class="page-list-item__title page-list-item-title"
      :href="url"
      target="_blank"
    >
      <span class="page-list-item-title-inner" :class="{ 'no-title': !page.pageTitle }">{{ title }}</span>
    </a>
    <div class="page-list-item__station">{{ station }}</div>
    <div class="page-list-item__status page-list-item-status">
      <span class="status-message" :class="status || 'published'">{{ statusMessage }}</span>
      <span v-if="statusTime" class="status-time">{{ statusTime }}</span>
    </div>
    <div class="page-list-item__manage buttons-group">
      <ui-button v-if="status === 'published'" class="buttons-group__unpublish" buttonType="button" color="red">Unpublish</ui-button>
      <div v-else-if="status === 'available'">
        <ui-button class="buttons-group__syndicate" buttonType="button" color="green">Syndicate</ui-button>
        <ui-button class="buttons-group__clone" buttonType="button" color="accent">Clone</ui-button>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import isValidDate from 'date-fns/is_valid';
  import dateFormat from 'date-fns/format';
  import isToday from 'date-fns/is_today';
  import isTomorrow from 'date-fns/is_tomorrow';
  import isYesterday from 'date-fns/is_yesterday';
  import isThisYear from 'date-fns/is_this_year';
  import { DEFAULT_STATION } from '../../../../services/universal/constants';
  import { _internals } from '../../../universal/syndication-utils';

  const { UiButton } = window.kiln.utils.components,
    nationalStationName = DEFAULT_STATION.name,
    formatHM = (date) => ' ' + dateFormat(date, 'h:mm A'),
    { findSyndicatedStation } = _internals;

  /**
   * format time for pages
   * @param  {Date} date
   * @return {string}
   */
  const formatStatusTime = (date) => {
    date = date ? new Date(date) : null;

    if (!date || !isValidDate(date)) {
      return null;
    }

    if (isToday(date)) {
      return 'Today' + formatHM(date);
    } else if (isTomorrow(date)) {
      return 'Tomorrow' + formatHM(date);
    } else if (isYesterday(date)) {
      return 'Yesterday' + formatHM(date);
    } else if (isThisYear(date)) {
      return dateFormat(date, 'M/D') + formatHM(date);
    } else {
      return dateFormat(date, 'M/D/YY') + formatHM(date);
    }
  }

  export default {
    props: ['page', 'stationFilter'],
    computed: {
      selectedStation() {
        const { slug: site_slug } = this.stationFilter;
        return { ...this.stationFilter, site_slug };
      },
      station() {
        return this.page.stationName || nationalStationName;
      },
      pageStatus() {
        let pageStatus = '';
        const page = this.page,
          selectedStation = this.selectedStation,
          findSyndication = findSyndicatedStation(selectedStation),
          syndicatedStation = findSyndication(page.stationSyndication),
          syndicationStatus = syndicatedStation ? 'published' : 'available';

        /*
          if the station slug of a content is equal to current selected station
          we don't check for syndication status because we have an original content.
          When the content doesn't have an station slug then it belongs to National,
          so we assign syndication status when National radio is not selected 
          (slug is different of empty string).
        */
        if (page.stationSlug) {
          pageStatus = page.stationSlug !== selectedStation.slug && syndicationStatus || '';
        } else if (selectedStation.slug !== '') {
          pageStatus = syndicationStatus;
        }

        return {
          status: pageStatus,
          statusMessage: (pageStatus || 'original').toUpperCase(),
          statusTime: formatStatusTime(page.dateModified),
          url: pageStatus === 'published' ? this.generatePageUrl(syndicatedStation) : page.canonicalUrl
        };
      },
      status() {
        return this.pageStatus.status;
      },
      statusMessage() {
        return this.pageStatus.statusMessage;
      },
      statusTime() {
        return this.pageStatus.statusTime;
      },
      url() {
        return this.pageStatus.url;
      },
      title() {
        return this.page.pageTitle
          ? _.truncate(this.page.pageTitle, { length: 60 })
          : 'No Title';
      }
    },
    methods: {
      /**
       * generate a page url to link to
       * @param  {object} syndicatedStation
       * @return {string}
       */
      generatePageUrl(syndicatedStation) {
        const canonicalUrl = this.page.canonicalUrl,
          host = new URL(canonicalUrl).origin,
          syndicatedArticleSlug = syndicatedStation && syndicatedStation.syndicatedArticleSlug || '' ;

        /*
          in the cases where we don't have a syndicated article slug (like when
          we syndicate a content to National), we link to the originating URL
        */
        return syndicatedArticleSlug ? `${host}${syndicatedArticleSlug}` : canonicalUrl;
      }
    },
    components: {
      UiButton
    }
  };
</script>
