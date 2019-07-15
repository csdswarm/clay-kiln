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
  import { NEWS_LIFESTYLE, highLevelCategoryOptions, secondaryCategoryOptions, 
  tertiaryCategoryOptions, getFetchResponse } from './brightcoveUtils.js';

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
        },
        NEWS_LIFESTYLE
      };
    },
    computed: {
      /**
       * Returns list of secondary categories dependent on highLevelCategory selected
       * @returns {Array}
       */
      secondaryCategoryOptions: function() {
        return secondaryCategoryOptions(this.highLevelCategory);
      },
      /**
       * Gets tags from combining secondary category, tertiary category and additional keywords
       * @returns {Array}
       */
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
      /**
       * Checks form validity dependent on highLevelCategory
       * @returns {boolean}
       */
      validForm: function() {
        const tertiaryCategory = this.highLevelCategory === NEWS_LIFESTYLE ? this.tertiaryCategory : true;

        return this.videoFile && this.videoName && this.shortDescription && this.station && this.highLevelCategory && this.secondaryCategory && tertiaryCategory && this.tags.length >= 2;
      }
    },
    methods: {
      /**
       * Get file stream from file input
       * @param {Object[]} files
       * @param {Object} event
       */
      setVideoFile(files, event) {
        this.fileUpload = event.target;
        this.videoFile = null;

        if (files.length) {
          this.videoFile = files[0];
        }
      },
      /**
       * Resets form fields and loading status
       */
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
      /**
       * When high level category is changed secondary and tertiary categories are reset
       * because the list of options changes dependent on high level category
       */
      resetCategories() {
        this.secondaryCategory = '';
        this.tertiaryCategory = '';
      },
      /**
       * Creates new video object in Brightcove,
       * uploads new video file to brightcove s3, 
       * & ingests video file to video object in brightcove.
       * Sets upload status alert on FE
       * @param {Object} event
       */
      async uploadNewVideo(event) {
        event.preventDefault();
        this.loading = true;
        this.uploadStatus.message = null;
        this.ingestStatus.message = null;
        try {
          const { videoFile, videoName, shortDescription, longDescription, 
            station, highLevelCategory, secondaryCategory, tertiaryCategory, tags, adSupported } = this,
            { status, statusText, data } = await getFetchResponse('POST', '/brightcove/create', { 
              videoName, shortDescription, longDescription, station, highLevelCategory, 
              secondaryCategory, tertiaryCategory, tags, adSupported 
            }, { 'Content-Type': 'application/json' } ),
            { signed_url, api_request_url, videoID } = data;

          if (status === 200 && signed_url && api_request_url && videoID) {
            try {
              // Upload video file to Brightcove S3
              const { status, statusText } = await getFetchResponse('PUT', signed_url, videoFile, { 'Content-Type': '' });

              if (status === 200) {
                const { status, statusText, data } = await getFetchResponse('POST', '/brightcove/upload', 
                  { api_request_url, videoID }, { 'Content-Type': 'application/json' }),
                  { video, jobID } = data;

                if (status === 200 && video && jobID) {
                  this.uploadedVideo = video;
                  this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.uploadedVideo });
                  this.uploadStatus = { type: 'success', message: 'Successfully uploaded video. Go to "Update Video" tab to edit. Please allow a few minutes for video renditions to be created.' };
                  this.getIngestStatus(jobID, videoID);
                } else {
                  this.uploadStatus = { type: 'error', message: `Failed to upload video -- ${ status } ${ statusText }` };
                }
              } else {
                this.loading = false;
                this.uploadStatus = { type: 'error', message: `Failed to upload video to Brightcove S3 -- ${ status } ${ statusText }` };
              }
            } catch (e) {
              this.loading = false;
              this.uploadStatus = { type: 'error', message: `Failed to upload video to Brightcove S3. ${e}` };
            }
          } else {
            this.loading = false;
            this.uploadStatus = { type: 'error', message: `Failed to create video -- ${ status } ${ statusText }` };
          }
        } catch(e) {
          this.loading = false;
          this.uploadStatus = { type: 'error', message: `Failed to create video. ${e}` };
        }
      },
      /**
       * Retrieves job status of ingesting video from brightcove S3 to brightcove video object
       * Sets ingest status alert on FE
       * @param {string} jobID
       * @param {string} videoID
       */
      getIngestStatus(jobID, videoID) {
        this.ingestStatus = { type: 'info', message: 'Creating video renditions...' };
        setTimeout(async () => {
          try {
            const { status, statusText, data: ingestStatus } = await getFetchResponse('POST', '/brightcove/ingestStatus',
              { jobID, videoID }, { 'Content-Type': 'application/json' }),
              { state } = ingestStatus;

            if (status === 200 && state) {
              if (['finished', 'failed'].includes(state)) {
                this.loading = false;
                this.ingestStatus.message = `${ state.replace('f','F') } creating renditions!`;
                this.ingestStatus.type = state === 'finished' ? 'success' : 'error';
                if (state === 'finished') {
                  const { status, statusText, data: videoWithMedia } = await getFetchResponse('GET', `/brightcove/get?id=${videoID}`);
                  
                  if (status === 200 && videoWithMedia) {
                    this.uploadedVideo = videoWithMedia;
                    this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.uploadedVideo });
                  } else {
                    this.uploadStatus = { type: 'error', message: `Failed to get video after it was created -- ${ status } ${ statusText }`};
                  }
                }
              } else {
                this.getIngestStatus(jobID, videoID);
              }
            } else {
              this.loading = false;
              this.ingestStatus = { type: 'error', message: `Failed to get ingest job status -- ${ status } ${ statusText }` };
            }
          } catch (e) {
            this.loading = false;
            this.ingestStatus = { type: 'error', message: `Failed to create renditions ${e}` };
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
