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
        v-if="highLevelCategory === 'NEWS_LIFESTYLE'"
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
        help="Please use no fewer than 3 keywords per video including categories selected above."
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
        trueValue="AD_SUPPORTED"
        falseValue="FREE"
      ></ui-checkbox>
      <ui-alert
        v-if="!validForm"
        type="error"
        dismissable=false
      >Please fill in all required fields (marked with *)
      </ui-alert>
      <div class="button-container">
        <ui-button
          size="large"
          :loading="loading"
          @click="updateVideo"
          :disabled="!validForm"
        >Upload</ui-button>
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
    <div v-if="editSuccess" class="brightcove-video-preview">
      <div class="video-preview__info">
        <strong>{{ updatedVideo.name }}</strong>
        <i class="video-preview__id">ID: {{ updatedVideo.id }}</i>
      </div>
      <img class="video-preview__image" :src=" updatedVideo.imageUrl">
    </div>
  </div>
</template>
<script>
  import axios from 'axios';
  import { transformVideoResults } from '../../../startup/brightcove.js'

  const { UiButton, UiTextbox, UiSelect, UiCheckbox, UiAlert } = window.kiln.utils.components,
    MUSIC_ENTERTAINMENT = 'MUSIC_ENTERTAINMENT',
    SPORTS = 'SPORTS',
    NEWS_LIFESTYLE = 'NEWS_LIFESTYLE',
    AD_SUPPORTED = 'AD_SUPPORTED',
    FREE = 'FREE';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        updatedVideo: null,
        loading: false,
        videoName: this.updatedVideo.name || '',
        shortDescription: this.updatedVideo.description || '',
        longDescription: this.updatedVideo.long_description || '',
        stationOptions: window.kiln.locals.allStationsCallsigns,
        station: this.updatedVideo.custom_fields.station || window.kiln.locals.station.callsign,
        highLevelCategoryOptions: [
          MUSIC_ENTERTAINMENT,
          SPORTS,
          NEWS_LIFESTYLE
        ],
        highLevelCategory: this.updatedVideo.custom_fields.high_level_category || '',
        secondaryCategory: this.derivedSecondaryCategory || '',
        tertiaryCategoryOptions: [
          'food', 'drink', 'travel', 'home', 'health', 'environment'
        ],
        tertiaryCategory: this.derivedTertiaryCategory || '',
        additionalKeywords: this.derivedKeywords || '',
        adSupported: this.updatedVideo.economics || AD_SUPPORTED,
        updateStatus: {
          type: 'info',
          message: ''
        }
      };
    },
    computed: {
      secondaryCategoryOptions: function() {
        let options = [];

        switch (this.highLevelCategory) {
          case MUSIC_ENTERTAINMENT:
            options = [
              'awards', 'performance', 'tv', 'streaming', 'digitalvideo', 'film', 'unrelatedentertainment', 'pop', 'rock', 'alternative', 'hiphop-r&b', 'country', 'classicrock', 'latino'
            ];
            break;
          case SPORTS:
            options = [
              'nfl', 'nhl', 'mlb', 'nba', 'ncaafootball', 'ncaabasketball', 'mma-wwe', 'tennis', 'golf', 'soccer', 'unrelatedsports'
            ];
            break;
          case NEWS_LIFESTYLE:
            options = [
              'national', 'lasvegas', 'international', 'losangeles', 'austin', 'madison', 'baltimore', 'memphis', 'boston', 'miami', 'buffalo', 'milwaukee', 'charlotte', 'minneapolis', 'chattanooga', 'neworleans', 'chicago', 'newyork', 'cleveland', 'norfolk', 'dfw', 'orlando', 'denver', 'phoenix', 'detroit', 'philadelphia', 'gainesville', 'pittsburgh', 'greensboro', 'portland', 'greenville', 'providence', 'hartford', 'richmond', 'houston', 'riverside', 'indianapolis', 'rochester', 'kansascity', 'sacramento', 'lasvegas', 'sandiego', 'losangeles', 'sanfrancisco', 'madison', 'seattle', 'memphis', 'springfield', 'miami', 'stlouis', 'milwaukee', 'washingtondc', 'minneapolis', 'wichita', 'neworleans', 'wilkesbarre'
            ];
            break;
          default:
        }
        return options;
      },
      tags: function() {
        const keywords = this.additionalKeywords ? this.additionalKeywords.split(',') : [];

        if (this.tertiaryCategory) {
          keywords.unshift(this.tertiaryCategory);
        }
        if (this.secondaryCategory) {
          keywords.unshift(this.secondaryCategory);
        }
        return keywords;
      },
      derivedSecondaryCategory: function() {
        return (this.updatedVideo.tags.filter(keyword => {
          return this.secondaryCategoryOptions.includes(keyword);
        })).join();
      },
      derivedTertiaryCategory: function() {
        return (this.updatedVideo.tags.filter(keyword => {
          return this.tertiaryCategoryOptions.includes(keyword);
        })).join();
      },
      derivedKeywords: function() {
        return (this.updatedVideo.tags.filter(keyword => {
          return !(this.secondaryCategoryOptions.concat(this.tertiaryCategoryOptions)).includes(keyword);
        })).join();
      },
      validForm: function() {
        const tertiaryCategory = this.highLevelCategory === NEWS_LIFESTYLE ? this.tertiaryCategory : true;

        return this.videoName && this.shortDescription && this.station && this.highLevelCategory && this.secondaryCategory && tertiaryCategory && this.tags.length >= 2;
      },
      updateSuccess: function() {
        return !this.loading && this.updatedVideo && this.updatedVideo.id;
      }
    },
    async created() {
      console.log("created update plugin", this.updatedVideo, this.data);
      if (this.data) {
        try {
          const video = await axios.get('/brightcove/get', { params: {
              id: this.data.id,
              full_object: true
            } });

          console.log("got video: ", video.data);

          if (video.data.id) {
            this.updatedVideo = video.data;
          }
        } catch (e) {
          console.error('Error retrieving video info');
        }
      }
    },
    methods: {
      resetForm() {
        this.videoName = this.updatedVideo.name;
        this.shortDescription = this.updatedVideo.description;
        this.longDescription = this.updatedVideo.long_description;
        this.station = this.updatedVideo.custom_fields.station;
        this.highLevelCategory = this.updatedVideo.custom_fields.high_level_category;
        this.secondaryCategory = this.derivedSecondaryCategory;
        this.tertiaryCategory = this.derivedTertiaryCategory;
        this.additionalKeywords = this.derivedKeywords;
        this.adSupported = this.updatedVideo.economics;
        this.loading = false;
        this.updatedVideo = null;
      },
      resetCategories() {
        this.secondaryCategory = '';
        this.tertiaryCategory = '';
      },
      async uploadNewVideo(event) {
        event.preventDefault();
        const { videoName, shortDescription, longDescription, station, highLevelCategory, secondaryCategory, tertiaryCategory, tags, adSupported } = this;

        console.log("update video with this data: ", { videoName, shortDescription, longDescription, station, highLevelCategory, secondaryCategory, tertiaryCategory, tags, adSupported });
        this.loading = true;
        const { data: updateResponse } = await axios.post('/brightcove/update', { videoName, shortDescription, longDescription, station, highLevelCategory, secondaryCategory, tertiaryCategory, tags, adSupported });

        console.log('updateResponse', updateResponse);
        this.loading = false;

        if (updateResponse.id) {
          this.updatedVideo = updateResponse;
          const transformedVideo = transformVideoResults([updateResponse])[0];

          this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: transformedVideo });
          this.updateStatus = { type: 'success', message: `Successfully updated video. Last Updated: ${ updateResponse.updated_at }` };
        } else {
          this.updateStatus = { type: 'error', message: `Failed to update video. ${ updateResponse }` };
        }
      }
    },
    components: {
      UiButton,
      UiFileupload,
      UiTextbox,
      UiSelect,
      UiCheckbox,
      UiAlert
    }
  }
</script>
