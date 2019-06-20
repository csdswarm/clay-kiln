<!--  Brightcove Upload -->
<docs>
  # Brightcove Upload
</docs>
<template>
  <div class="brightcove-upload">
    <div class="brightcove-upload__upload-options">
      <ui-fileupload
        required
        accept=".avi,.mov,.mp4,.mpeg"
        name="brightcove-upload"
        @change="addVideoFile"
      ></ui-fileupload>
      <ui-textbox
        required
        maxlength=255
        enforceMaxlength
        floating-label
        label="Video Name"
        v-model="videoName"
      ></ui-textbox>
      <ui-select
        required
        has-search
        floating-label
        label="Choose a station"
        :options="stationOptions"
        v-model="selectedStation"
        :value="defaultStation"
      ></ui-select>
      <ui-textbox
        required
        floating-label
        label="Short Description"
        maxlength=248
        enforceMaxlength
        v-model="shortDescription"
      ></ui-textbox>
      <ui-textbox
        multiLine
        floating-label
        label="Long Description"
        maxlength=5000
        enforceMaxlength
        v-model="longDescription"
      ></ui-textbox>
      <ui-button
        @click="uploadNewVideo"
      >Upload</ui-button>
    </div>
    <ui-progress-circular v-show="loading"></ui-progress-circular>
    <div v-if="uploadSuccess" class="brightcove-video-preview">
        <div class="video-preview__info">
            <strong>{{uploadedVideo.name}}</strong>
            <i class="video-preview__id">ID: {{uploadedVideo.id}}</i>
        </div>
        <img class="video-preview__image" :src="uploadedVideo.imageUrl" />
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
        uploadedVideo: { id: this.data },
        loading: false,
        videoName: '',
        stationOptions: [],
        selectedStation: window.kiln.locals.station.callsign,
        shortDescription: '',
        longDescription: ''
      };
    },
    computed: {
      uploadSuccess: function () {
        return !this.loading && this.uploadedVideo;
      }
    },
    async created() {
      // if (this.data) {
      //   try {
      //     const results = await axios.get('/brightcove/search', {params: { query: this.data }});
      //     if (results.data[0]) {
      //       this.uploadedVideo = results.data[0];
      //     }
      //   } catch (e) {
      //     console.error('Error retrieving video info');
      //   }
      // }
    },
    methods: {
      addVideoFile(files, event) {
        this.videoFile = files.length ? files[0] : null;
      },
      async uploadNewVideo(event) {
        event.preventDefault();
        const {videoFile, videoName, selectedStation, shortDescription, longDescription} = this;
        console.log("create new video with this data: ", {videoFile, videoName, selectedStation, shortDescription, longDescription});
        this.loading = true;
        this.uploadedVideo = await axios.post('/brightcove/upload', {videoFile, videoName, selectedStation, shortDescription, longDescription});
        this.loading = false;
        if (this.uploadedVideo) {
          // this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.uploadedVideo.id })
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
