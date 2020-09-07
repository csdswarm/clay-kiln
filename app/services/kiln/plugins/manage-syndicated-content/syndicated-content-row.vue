<template>
  <div class="syndicated-content-row page-list-item">
    <a
      class="page-list-item__title page-list-item-title"
      :href="url"
      target="_blank"
    >
      <span class="page-list-item-title-inner" :class="{ 'no-title': !content.pageTitle }">{{ title }}</span>
    </a>
    <div class="page-list-item__station">{{ station }}</div>
    <div class="page-list-item__status page-list-item-status">
      <span class="status-message" :class="status || 'published'">{{ statusMessage }}</span>
      <span v-if="statusTime" class="status-time">{{ statusTime }}</span>
    </div>
    <div class="page-list-item__manage buttons-group">
      <ui-button v-if="status === 'published'" 
        class="buttons-group__unpublish" 
        buttonType="button" 
        color="red" 
        @click.stop="onUnpublish" 
        :loading="unpublishLoading">
        Unpublish
      </ui-button>
      <div v-else-if="status === 'available'">
        <ui-button
          class="buttons-group__syndicate"
          buttonType="button" color="green"
          @click.stop="onSyndicate"
          :loading="syndicationLoading"
        >Syndicate</ui-button>
        <ui-button class="buttons-group__clone" buttonType="button" color="accent" :loading="cloneLoading" @click="clonePage(content.canonicalUrl)">Clone</ui-button>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import axios from 'axios';
  import isValidDate from 'date-fns/is_valid';
  import dateFormat from 'date-fns/format';
  import isToday from 'date-fns/is_today';
  import isTomorrow from 'date-fns/is_tomorrow';
  import isYesterday from 'date-fns/is_yesterday';
  import isThisYear from 'date-fns/is_this_year';
  import { DEFAULT_STATION } from '../../../../services/universal/constants';
  import { findSyndicatedStation } from '../../../universal/syndication-utils';
  import { pagesRoute,refProp, uriToUrl, htmlExt, editExt } from '../new-page-override/clay-kiln-utils';

  const { UiButton } = window.kiln.utils.components,
    nationalStationName = DEFAULT_STATION.name,
    formatHM = (date) => ' ' + dateFormat(date, 'h:mm A');

  /**
   * format time for content
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
    props: ['content', 'stationFilter'],
    data() {
      return {
        unpublishLoading: false,
        cloneLoading: false
      }
    },
    computed: {
      syndicationLoading() {
        return this.content.syndicationLoading || false;
      },
      selectedStation() {
        return this.stationFilter;
      },
      station() {
        return this.content.stationName || nationalStationName;
      },
      contentStatus() {
        let contentStatus = '';
        const content = this.content,
          selectedStationSlug = this.selectedStation.slug,
          findSyndication = findSyndicatedStation(selectedStationSlug),
          syndicatedStation = findSyndication(content.stationSyndication),
          syndicationStatus = syndicatedStation && !syndicatedStation.unsubscribed ? 'published' : 'available';

        this.unpublishLoading = false;

        /*
          if the station slug of a content is equal to current selected station
          we don't check for syndication status because we have an original content.
          When the content doesn't have an station slug then it belongs to National,
          so we assign syndication status when National radio is not selected 
          (slug is different of empty string).
        */
        if (content.stationSlug) {
          contentStatus = content.stationSlug === selectedStationSlug ? '' : syndicationStatus;
        } else if (selectedStationSlug !== '') {
          contentStatus = syndicationStatus;
        }

        return {
          status: contentStatus,
          statusMessage: (contentStatus || 'original').toUpperCase(),
          statusTime: formatStatusTime(content.dateModified),
          url: contentStatus === 'published' ? this.generateContentUrl(syndicatedStation) : content.canonicalUrl
        };
      },
      status() {
        return this.contentStatus.status;
      },
      statusMessage() {
        return this.contentStatus.statusMessage;
      },
      statusTime() {
        return this.contentStatus.statusTime;
      },
      url() {
        return this.contentStatus.url;
      },
      title() {
        return this.content.pageTitle
          ? _.truncate(this.content.pageTitle, { length: 60 })
          : 'No Title';
      }
    },
    methods: {
      async clonePage(canonicalUrl) {
        this.cloneLoading = true;

        const prefix = _.get(this.$store, 'state.site.prefix'),
          { data: newPage } = await axios.post(`/rdc/clone-content`,
            {
              canonicalUrl,
              stationSlug: this.selectedStation.slug
            },
            { withCredentials: true }
          ),
          editNewPageUrl = uriToUrl(newPage[refProp]) + htmlExt + editExt;

        window.location.href = editNewPageUrl;
      },
      /**
       * generate a content url to link to
       * @param  {object} syndicatedStation
       * @return {string}
       */
      generateContentUrl(syndicatedStation) {
        const canonicalUrl = this.content.canonicalUrl,
          host = new URL(canonicalUrl).origin,
          syndicatedArticleSlug = _.get(syndicatedStation, 'syndicatedArticleSlug', '') ;

        /*
          in the cases where we don't have a syndicated article slug (like when
          we syndicate a content to National), we link to the originating URL
        */
        return syndicatedArticleSlug ? `${host}${syndicatedArticleSlug}` : canonicalUrl;
      },
      /**
       * emit event for selecting primary and secondary section
       * fronts before creating the syndication
       */
      onSyndicate() {
        this.$emit('createSyndication', this.content);
      },
      /**
       * unpublish syndicated station from content
       */
      async onUnpublish() {
        this.unpublishLoading = true;
        await axios.post('/rdc/syndicated-content/unpublish', { uri: this.content._id, station: this.selectedStation });
        // Reload content to refresh updated data
        this.$emit('reloadContent', null);
      }
    },
    components: {
      UiButton
    }
  };
</script>
