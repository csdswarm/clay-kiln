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
        @change="setVideoFile"
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
      <ui-alert
        v-if="uploadStatus.message"
        :type="uploadStatus.type"
      >{{ uploadStatus.message }}</ui-alert>
      <ui-alert
        v-if="uploadStatus.type === 'success' && ingestStatus.message"
        :type="ingestStatus.type"
      >{{ ingestStatus.message }}</ui-alert>
    </div>
    <div v-if="uploadedVideo && ingestStatus.type === 'success'" class="brightcove-video-preview">
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
  import 'whatwg-fetch';
  import { NEWS_LIFESTYLE, highLevelCategoryOptions, secondaryCategoryOptions, tertiaryCategoryOptions } from './brightcoveCategories.js';

  const { UiButton, UiFileupload, UiTextbox, UiSelect, UiCheckbox, UiAlert } = window.kiln.utils.components,
    AD_SUPPORTED = 'AD_SUPPORTED',
    FREE = 'FREE';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        uploadedVideo: null,
        loading: false,
        videoFile: null,
        videoName: '',
        shortDescription: '',
        longDescription: '',
        stationOptions: window.kiln.locals.allStationsCallsigns,
        station: window.kiln.locals.station.callsign,
        highLevelCategoryOptions,
        highLevelCategory: '',
        secondaryCategory: '',
        tertiaryCategoryOptions,
        tertiaryCategory: '',
        additionalKeywords: '',
        adSupported: AD_SUPPORTED,
        uploadStatus: {
          type: 'info',
          message: ''
        },
        ingestStatus: {
          type: 'info',
          message: ''
        }
      };
    },
    computed: {
      secondaryCategoryOptions: function() {
        return secondaryCategoryOptions(this.highLevelCategory);
      },
      tags: function() {
        const keywords = this.additionalKeywords ? this.additionalKeywords.split(',') : [],
          keywordsTrimmed = keywords.map(keyword => { return keyword.trim(); });

        if (this.tertiaryCategory) {
          keywordsTrimmed.unshift(this.tertiaryCategory);
        }
        if (this.secondaryCategory) {
          keywordsTrimmed.unshift(this.secondaryCategory);
        }
        return keywordsTrimmed;
      },
      validForm: function() {
        const tertiaryCategory = this.highLevelCategory === NEWS_LIFESTYLE ? this.tertiaryCategory : true;

        return this.videoFile && this.videoName && this.shortDescription && this.station && this.highLevelCategory && this.secondaryCategory && tertiaryCategory && this.tags.length >= 2;
      }
    },
    methods: {
      setVideoFile(files, event) {
        this.fileUpload = event.target;
        this.videoFile = null;

        if (files.length) {
          this.videoFile = files[0];
        }
      },
      resetForm() {
        this.uploadedVideo = null;
        this.videoFile = null;
        this.videoName = '';
        this.shortDescription = '';
        this.longDescription = '';
        this.station = window.kiln.locals.station.callsign;
        this.highLevelCategory = '';
        this.secondaryCategory = '';
        this.tertiaryCategory = '';
        this.additionalKeywords = '';
        this.adSupported = AD_SUPPORTED;
        this.loading = false;
      },
      resetCategories() {
        this.secondaryCategory = '';
        this.tertiaryCategory = '';
      },
      async uploadNewVideo(event) {
        event.preventDefault();
        this.loading = true;
        this.uploadStatus.message = null;
        this.ingestStatus.message = null;
        const { videoFile, videoName, shortDescription, longDescription, station, highLevelCategory, secondaryCategory, tertiaryCategory, tags, adSupported } = this,
          { status, data: createResponse } = await axios.post('/brightcove/create', { videoName, shortDescription, longDescription, station, highLevelCategory, secondaryCategory, tertiaryCategory, tags, adSupported }),
          { signed_url, api_request_url, videoID } = createResponse;

        if (status === 200 && signed_url && api_request_url && videoID) {
          try {
            // Upload video file to Brightcove S3
            const { status, statusText } = await fetch(signed_url, {
              method: 'PUT',
              body: videoFile,
              headers:{
                'Content-Type': ''
              }
            });

            if (status === 200) {
              const { status, data: ingestResponse } = await axios.post('/brightcove/upload', { api_request_url, videoID });

              if (status === 200 && ingestResponse.video.id) {
                this.uploadedVideo = ingestResponse.video;
                this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.uploadedVideo });
                this.uploadStatus = { type: 'success', message: 'Successfully uploaded video. Go to "Update Video" tab to edit. Please allow a few minutes for video renditions to be created.' };
                this.getIngestStatus(ingestResponse.jobID, videoID);
              } else {
                this.uploadStatus = { type: 'error', message: `${ status } Failed to upload video. ${ ingestResponse }` };
              }
            } else {
              this.loading = false;
              this.uploadStatus = { type: 'error', message: `${ status } Failed to upload video to Brightcove S3. ${ statusText }` };
            }
          } catch (e) {
            this.loading = false;
            this.uploadStatus = { type: 'error', message: `Failed to upload video to Brightcove S3. ${e}` };
          }
        } else {
          this.loading = false;
          this.uploadStatus = { type: 'error', message: `${ status } Failed to create video. ${ createResponse }` };
        }
      },
      getIngestStatus(jobID, videoID) {
        this.ingestStatus = { type: 'info', message: 'Creating video renditions...' };
        setTimeout(async () => {
          try {
            const { status, data: ingestStatus } = await axios.post('/brightcove/ingestStatus', { jobID, videoID });

            if (status === 200) {
              if (['finished', 'failed'].includes(ingestStatus)) {
                this.loading = false;
                this.ingestStatus.message = `${ ingestStatus.replace('f','F') } creating renditions!`;
                this.ingestStatus.type = ingestStatus === 'finished' ? 'success' : 'error';
                if (ingestStatus === 'finished') {
                  const { data: videoWithMedia } = await axios.get('/brightcove/get', { params: {
                    id: videoID
                  } });

                  this.uploadedVideo = videoWithMedia;
                  this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.uploadedVideo });
                }
              } else {
                this.getIngestStatus(jobID, videoID);
              }
            } else {
              this.loading = false;
              this.ingestStatus.message = `${ status } Failed to get ingest job status. ${ ingestStatus }`;
            }
          } catch (e) {
            this.loading = false;
            this.ingestStatus.message = `Failed to create renditions ${e}`;
          }
        }, 5000);
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
