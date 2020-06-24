<!--  Brightcove Update -->
<docs>
  # Brightcove Update
</docs>
<template>
  <div class="brightcove-update">
    <div class="brightcove-update__update-options">
      <ui-textbox
        required
        maxlength="255"
        enforceMaxlength
        floating-label
        label="Video Name *"
        v-model="videoName"
      ></ui-textbox>
      <ui-textbox
        required
        floating-label
        label="Short Description *"
        maxlength="248"
        enforceMaxlength
        v-model="shortDescription"
      ></ui-textbox>
      <ui-textbox
        multiLine
        floating-label
        label="Long Description"
        maxlength="5000"
        enforceMaxlength
        v-model="longDescription"
      ></ui-textbox>
      <ui-select
        required
        has-search
        floating-label
        label="Choose a station *"
        :options="stationOptions"
        v-model="station"
      ></ui-select>
      <ui-select
        required
        has-search
        floating-label
        label="Choose a high level category *"
        :options="highLevelCategoryOptions"
        v-model="highLevelCategory"
        @change="resetCategories"
      ></ui-select>
      <ui-select
        v-if="highLevelCategory"
        required
        has-search
        floating-label
        label="Choose a secondary category *"
        :options="secondaryCategoryOptions"
        v-model="secondaryCategory"
      ></ui-select>
      <ui-select
        v-if="highLevelCategory === NEWS_LIFESTYLE"
        required
        has-search
        floating-label
        label="Choose a tertiary category *"
        :options="tertiaryCategoryOptions"
        v-model="tertiaryCategory"
      ></ui-select>
      <ui-textbox
        multiLine
        floating-label
        label="Additional Keywords (Separate with commas)"
        help="Use no fewer than 3 keywords per video including categories selected above."
        v-model="additionalKeywords"
      ></ui-textbox>
      <ui-alert
        v-if="tags.length < 2 && highLevelCategory"
        type="warning"
        dismissable=false
      >More keywords are required to update.
      </ui-alert>
      <ui-checkbox
        label="Enable preroll?"
        v-model="adSupported"
        checked
        :trueValue="AD_SUPPORTED"
        :falseValue="FREE"
      ></ui-checkbox>
      <ui-alert
        v-if="!validForm"
        :type="ERROR"
        dismissable=false
      >Fill in all required fields (marked with *)
      </ui-alert>
      <div class="button-container">
        <ui-button
          size="large"
          :loading="loading"
          @click="updateVideo"
          :disabled="!validForm"
        >Update</ui-button>
        <ui-button
          size="large"
          buttonType="reset"
          iconPosition="right"
          @click="resetForm"
        >Reset Fields to Last Update</ui-button>
      </div>
      <ui-alert
        v-if="!loading && updateStatus.message"
        :type="updateStatus.type"
      >{{ updateStatus.message }}</ui-alert>
    </div>
    <div v-if="updateSuccess" class="brightcove-video-preview">
      <div class="video-preview__info">
        <strong>{{ transformedVideo.name }}</strong>
        <i class="video-preview__id">ID: {{ transformedVideo.id }}</i>
      </div>
      <img v-if="transformedVideo.imageUrl" class="video-preview__image" :src="transformedVideo.imageUrl">
    </div>
  </div>
</template>
<script>
  import { transformVideoResults } from '../../../startup/brightcove.js';
  import { AD_SUPPORTED, FREE, INFO, ERROR, SUCCESS, NEWS_LIFESTYLE,
  highLevelCategoryOptions, secondaryCategoryOptions, tertiaryCategoryOptions, getFetchResponse } from './brightcoveUtils.js';

  const { UiButton, UiTextbox, UiSelect, UiCheckbox, UiAlert } = window.kiln.utils.components;

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        updatedVideo: this.data || null,
        transformedVideo: null,
        loading: false,
        videoName: '',
        shortDescription: '',
        longDescription: '',
        stationOptions: window.kiln.locals.allStationsCallsigns,
        station: window.kiln.locals.station.callsign,
        highLevelCategoryOptions,
        highLevelCategory: '',
        secondaryCategoryOptions: [],
        secondaryCategory: '',
        tertiaryCategoryOptions: [],
        tertiaryCategory: '',
        additionalKeywords: '',
        adSupported: AD_SUPPORTED,
        updateStatus: {
          type: INFO,
          message: ''
        },
        AD_SUPPORTED,
        FREE,
        ERROR,
        NEWS_LIFESTYLE,
        video_updated_by : window.kiln.locals.user.username
      };
    },
    computed: {
      /**
       * Gets tags from combining secondary category, tertiary category and additional keywords
       *
       * @returns {Array}
       */
      tags() {
        const keywords = this.additionalKeywords ? this.additionalKeywords.split(',') : [];

        if (this.tertiaryCategory) {
          keywords.unshift(this.tertiaryCategory);
        }
        if (this.secondaryCategory) {
          keywords.unshift(this.secondaryCategory);
        }
        return keywords;
      },
      /**
       * Determines secondary category of video from its tags
       *
       * @returns {String}
       */
      derivedSecondaryCategory() {
        return (this.updatedVideo.tags.filter(keyword => {
          return this.secondaryCategoryOptions.includes(keyword);
        })).join();
      },
      /**
       * Determines tertiary category of video from its tags
       *
       * @returns {String}
       */
      derivedTertiaryCategory() {
        return (this.updatedVideo.tags.filter(keyword => {
          return this.tertiaryCategoryOptions.includes(keyword);
        })).join();
      },
      /**
       * Determines keywords from tags by extracting out categories
       *
       * @returns {String}
       */
      derivedKeywords() {
        return (this.updatedVideo.tags.filter(keyword => {
          return !(this.secondaryCategoryOptions.concat(this.tertiaryCategoryOptions)).includes(keyword);
        })).join(', ');
      },
      /**
       * Checks form validity dependent on highLevelCategory
       *
       * @returns {boolean}
       */
      validForm() {
        const tertiaryCategory = this.highLevelCategory === NEWS_LIFESTYLE ? this.tertiaryCategory : true;

        return this.videoName && this.shortDescription && this.station && this.highLevelCategory && this.secondaryCategory && tertiaryCategory && this.tags.length >= 2;
      },
      /**
       * Returns success of update if done loading and video is set
       *
       * @returns {boolean}
       */
      updateSuccess() {
        return !this.loading && this.transformedVideo && this.transformedVideo.id;
      }
    },
    watch: {
      /**
       * Resets preview of video and updates form
       * with newly selected video data
       *
       * @param {string} newSelectedCategory
       */
      data(vid) {
        this.transformedVideo = vid;
        this.setUpdateStatus(INFO, null);
        this.populateFormWithData(vid);
      },
      /**
       * Gets updated secondary categories when high level category is changed
       *
       * @param {string} newSelectedCategory
       */
      async highLevelCategory(newSelectedCategory) {
        this.secondaryCategoryOptions = await secondaryCategoryOptions(newSelectedCategory);
      }
    },
    async created() {
      if (this.data) {
        this.tertiaryCategoryOptions = await tertiaryCategoryOptions();
        this.populateFormWithData(this.data);
      }
    },
    methods: {
      /**
       * Set update status on FE
       *
       * @param {string} type
       * @param {string} message
       */
      setUpdateStatus(type, message) {
        this.updateStatus = { type, message };
      },
      /**
       * Retrieves video object from brightcove with video ID and
       * populates update form fields with this data
       *
       * @param {Object} vid
       */
      async populateFormWithData(vid) {
        try {
          const { status, statusText, data: video } = await getFetchResponse('GET', `/brightcove/get?id=${ vid.id }&full_object=true`);

          if (status === 200 && video.id) {
            this.updatedVideo = video;
            this.videoName = this.updatedVideo.name;
            this.shortDescription = this.updatedVideo.description;
            this.longDescription = this.updatedVideo.long_description;
            this.station = this.updatedVideo.custom_fields.station;
            this.video_updated_by = window.kiln.locals.user.username;
            this.highLevelCategory = this.updatedVideo.custom_fields.high_level_category;
            this.secondaryCategoryOptions = await secondaryCategoryOptions(this.highLevelCategory);
            this.secondaryCategory = this.derivedSecondaryCategory;
            this.tertiaryCategory = this.derivedTertiaryCategory;
            this.additionalKeywords = this.derivedKeywords;
            this.adSupported = this.updatedVideo.economics;
          } else {
            this.setUpdateStatus(ERROR, `Error retrieving video info -- ${ status } ${ statusText }`);
          }
        } catch (e) {
          this.setUpdateStatus(ERROR, `Error retrieving video info -- ${ e.message }`);
        }
      },
      /**
       * Resets form fields back to the last values retrieved from api
       * and resets the loading status
       *
       */
      async resetForm() {
        this.videoName = this.updatedVideo.name;
        this.shortDescription = this.updatedVideo.description;
        this.longDescription = this.updatedVideo.long_description;
        this.station = this.updatedVideo.custom_fields.station;
        this.video_updated_by = window.kiln.locals.user.username;
        this.highLevelCategory = this.updatedVideo.custom_fields.high_level_category;
        this.secondaryCategoryOptions = await secondaryCategoryOptions(this.highLevelCategory);
        this.secondaryCategory = this.derivedSecondaryCategory;
        this.tertiaryCategory = this.derivedTertiaryCategory;
        this.additionalKeywords = this.derivedKeywords;
        this.adSupported = this.updatedVideo.economics;
        this.loading = false;
        this.transformedVideo = null;
        this.setUpdateStatus(INFO, null);
      },
      /**
       * When high level category is changed secondary and tertiary categories are reset
       * because the list of options changes dependent on high level category
       *
       */
      resetCategories() {
        this.secondaryCategory = '';
        this.tertiaryCategory = '';
      },
      /**
       * Updates existing video in brightcove and sets video to updated video
       *
       * @param {Object} event
       */
      async updateVideo(event) {
        event.preventDefault();
        const { updatedVideo: video, videoName, shortDescription, longDescription, station,
          highLevelCategory, secondaryCategory, tertiaryCategory, tags, adSupported, video_updated_by } = this;

        this.loading = true;
        try {
          const { status, statusText, data: updateResponse } = await getFetchResponse('POST', '/brightcove/update',
            {
              video, videoName, shortDescription, longDescription, station,
              highLevelCategory, secondaryCategory, tertiaryCategory, tags, adSupported, video_updated_by
            }, {'Content-Type': 'application/json'} );

          this.loading = false;

          if (status === 200 && updateResponse.id) {
            this.updatedVideo = updateResponse;
            this.transformedVideo = await transformVideoResults([updateResponse])[0];

            this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.transformedVideo });
            this.setUpdateStatus(SUCCESS, `Successfully updated video. Last Updated: ${ updateResponse.updated_at }`);
          } else {
            this.setUpdateStatus(ERROR, `Failed to update video -- ${ status } ${ statusText }`);
          }
        } catch(e) {
          this.loading = false;
          this.setUpdateStatus(ERROR, `Failed to update video -- ${ e.message }`);
        }
      }
    },
    components: {
      UiButton,
      UiTextbox,
      UiSelect,
      UiCheckbox,
      UiAlert
    }
  }
</script>
