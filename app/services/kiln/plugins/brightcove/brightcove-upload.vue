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
        @change="addVideoFile"
      ></ui-fileupload>
      <ui-textbox
        required
        maxlength="255"
        enforceMaxlength
        floating-label
        label="Video Name *"
        v-model="name"
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
        help="Please use no fewer than 3 keywords per video. Keywords are not case sensitive. And please avoid spaces!"
        v-model="additionalKeywords"
      ></ui-textbox>
      <ui-button @click="uploadNewVideo">Upload</ui-button>
      <strong v-if="!validForm">Please fill in all required fields (marked with *)</strong>
    </div>
    <ui-progress-circular v-show="loading"></ui-progress-circular>
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

  const UiButton = window.kiln.utils.components.UiButton,
    UiFileupload = window.kiln.utils.components.UiFileupload,
    UiProgressCircular = window.kiln.utils.components.UiProgressCircular,
    UiTextbox = window.kiln.utils.components.UiTextbox,
    UiSelect = window.kiln.utils.components.UiSelect;

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        uploadedVideo: null,
        loading: false,
        name: '',
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
        secondaryCategoryOptions: [],
        secondaryCategory: '',
        tertiaryCategoryOptions: [
          'food', 'drink', 'travel', 'home', 'health', 'environment'
        ],
        tertiaryCategory: '',
        additionalKeywords: ''
      };
    },
    computed: {
      secondaryCategoryOptions: function () {
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
      formattedKeywords: function () {
        return this.additionalKeywords.replace(/\s/g, '').toLowerCase();
      },
      validForm: function() {
        return this.name && this.shortDescription && this.station && this.highLevelCategory && this.secondaryCategory && (this.highLevelCategory === 'NEWS_LIFESTYLE' ? this.tertiaryCategory : true);
      },
      uploadSuccess: function () {
        return !this.loading && this.uploadedVideo.id;
      }
    },
    async created() {
      console.log("created", this.uploadedVideo, this.data);
      if (this.data) {
        try {
          const video = await axios.get('/brightcove/get', {params: { query: {id: this.data} }});

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
      async uploadNewVideo(event) {
        event.preventDefault();
        const { videoFile, name, shortDescription, longDescription, station, highLevelCategory, secondaryCategory, tertiaryCategory, formattedKeywords } = this;
        if (validForm) {
          console.log("create new video with this data: ", { videoFile, name, shortDescription, longDescription, station, highLevelCategory, secondaryCategory, tertiaryCategory, formattedKeywords });
          this.loading = true;
          this.uploadedVideo = await axios.post('/brightcove/upload', { videoFile, name, shortDescription, longDescription, station, highLevelCategory, secondaryCategory, tertiaryCategory, formattedKeywords });
          if (this.uploadedVideo.id) {
            this.loading = false;
            this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.uploadedVideo.id })
          }
        }
      }
    },
    components: {
      UiButton,
      UiFileupload,
      UiProgressCircular,
      UiTextbox,
      UiSelect
    }
  }
</script>
