<!--  Brightcove Upload -->
<docs>
  # Brightcove Upload
</docs>
<template>
  <div class="brightcove-upload">
    <div class="brightcove-upload__upload-options">
      <ui-fileupload
        required
        accept=".avi, .mov, .mp4, .mpeg"
        name="brightcove-upload"
        label="CHOOSE A FILE *"
        @change="addVideoFile"
      ></ui-fileupload>
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
      >More keywords are required to upload.
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
      <ui-alert
        v-if="uploadSuccess"
        type="success"
      >Successfully uploaded new video.</ui-alert>
      <div class="button-container">
        <ui-button 
          size="large"
          :loading="loading"
          @click="uploadNewVideo"
          :disabled="!validForm"
        >Upload</ui-button>
        <ui-button 
          size="large"
          buttonType="reset"
          iconPosition="right"
          @click="resetForm"
        >Reset Fields</ui-button>
      </div>
    </div>
    <div v-if="uploadSuccess" class="brightcove-video-preview">
      <div class="video-preview__info">
        <strong>{{uploadedVideo.name}}</strong>
        <i class="video-preview__id">ID: {{uploadedVideo.id}}</i>
      </div>
      <img class="video-preview__image" :src="uploadedVideo.imageUrl">
    </div>
  </div>
</template>
<script>
  import axios from 'axios';

  const { UiButton, UiFileupload, UiProgressCircular, UiTextbox, UiSelect, UiCheckbox, UiAlert } = window.kiln.utils.components;

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        uploadedVideo: null,
        loading: false,
        videoName: '',
        shortDescription: '',
        longDescription: '',
        stationOptions: window.kiln.locals.allStationsCallsigns,
        station: window.kiln.locals.station.callsign,
        highLevelCategoryOptions: [
          "MUSIC_ENTERTAINMENT",
          "SPORTS",
          "NEWS_LIFESTYLE"
        ],
        highLevelCategory: '',
        secondaryCategory: '',
        tertiaryCategoryOptions: [
          'food', 'drink', 'travel', 'home', 'health', 'environment'
        ],
        tertiaryCategory: '',
        additionalKeywords: '',
        adSupported: 'AD_SUPPORTED'
      };
    },
    computed: {
      secondaryCategoryOptions: function() {
        let options = [];

        switch (this.highLevelCategory) {
          case 'MUSIC_ENTERTAINMENT':
            options = [
              'awards', 'performance', 'tv', 'streaming', 'digitalvideo', 'film', 'unrelatedentertainment', 'pop', 'rock', 'alternative', 'hiphop-r&b', 'country', 'classicrock', 'latino'
            ];
            break;
          case 'SPORTS':
            options = [
              'nfl', 'nhl', 'mlb', 'nba', 'ncaafootball', 'ncaabasketball', 'mma-wwe', 'tennis', 'golf', 'soccer', 'unrelatedsports'
            ];
            break;
          case 'NEWS_LIFESTYLE':
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
        console.log("tags", keywords);
        return keywords;
      },
      validForm: function() {
        const tertiaryCategory = this.highLevelCategory === 'NEWS_LIFESTYLE' ? this.tertiaryCategory : true;

        return this.videoFile && this.videoName && this.shortDescription && this.station && this.highLevelCategory && this.secondaryCategory && tertiaryCategory && this.tags.length >= 2;
      },
      uploadSuccess: function () {
        return !this.loading && this.uploadedVideo && this.uploadedVideo.id;
      }
    },
    async created() {
      console.log("created", this.uploadedVideo, this.data);
      if (this.data) {
        try {
          const video = await axios.get('/brightcove/get', { params: { id: this.data.id } });
          console.log("got video: ", video);

          if (video.id) {
            this.uploadedVideo = video;
          }
        } catch (e) {
          console.error('Error retrieving video info');
        }
      }
    },
    methods: {
      addVideoFile(files, event) {
        this.videoFile = files.length ? files[0] : null;
      },
      resetForm() {
        this.uploadedVideo = null;
        this.videoName = '';
        this.shortDescription = '';
        this.longDescription = '';
        this.station = window.kiln.locals.station.callsign;
        this.highLevelCategory = '';
        this.secondaryCategory = '';
        this.tertiaryCategory = '';
        this.additionalKeywords = '';
        this.adSupported = 'AD_SUPPORTED';
      },
      resetCategories() {
        this.secondaryCategory = '';
        this.tertiaryCategory = '';
      },
      async uploadNewVideo(event) {
        event.preventDefault();
        const { videoFile, videoName, shortDescription, longDescription, station, highLevelCategory, secondaryCategory, tertiaryCategory, tags, adSupported } = this;
        if (this.validForm) {
          console.log("create new video with this data: ", { videoFile, videoName, shortDescription, longDescription, station, highLevelCategory, secondaryCategory, tertiaryCategory, tags, adSupported });
          this.loading = true;
          this.uploadedVideo = await axios.post('/brightcove/upload', { videoFile, videoName, shortDescription, longDescription, station, highLevelCategory, secondaryCategory, tertiaryCategory, tags, adSupported });
          if (this.uploadedVideo.id) {
            this.loading = false;
            this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.uploadedVideo });
          }
        } else {
          console.log("failed upload - data: ", { videoFile, videoName, shortDescription, longDescription, station, highLevelCategory, secondaryCategory, tertiaryCategory, tags, adSupported });
        }
      }
    },
    components: {
      UiButton,
      UiFileupload,
      UiProgressCircular,
      UiTextbox,
      UiSelect,
      UiCheckbox,
      UiAlert
    }
  }
</script>
