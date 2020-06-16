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
        label="Video Tags (separated by commas)"
        help="Use no fewer than 3 keywords per video including categories selected above."
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
        v-if="uploadStatus.type === SUCCESS && ingestStatus.message"
        :type="ingestStatus.type"
      >{{ ingestStatus.message }}</ui-alert>
    </div>
    <div v-if="uploadedVideo && ingestStatus.type === SUCCESS" class="brightcove-video-preview">
      <div class="video-preview__info">
        <strong>{{ uploadedVideo.name }}</strong>
        <i class="video-preview__id">ID: {{ uploadedVideo.id }}</i>
      </div>
      <img v-if="uploadedVideo.imageUrl" class="video-preview__image" :src="uploadedVideo.imageUrl">
    </div>
  </div>
</template>
<script>
  import { AD_SUPPORTED, FREE, INFO, ERROR, SUCCESS, NEWS_LIFESTYLE,
  highLevelCategoryOptions, secondaryCategoryOptions, tertiaryCategoryOptions, getFetchResponse } from './brightcoveUtils.js';

  const { UiButton, UiFileupload, UiTextbox, UiSelect, UiCheckbox, UiAlert } = window.kiln.utils.components,
    UPLOAD = 'upload',
    INGEST = 'ingest';

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
        secondaryCategoryOptions: [],
        secondaryCategory: '',
        tertiaryCategoryOptions: [],
        tertiaryCategory: '',
        additionalKeywords: '',
        adSupported: AD_SUPPORTED,
        uploadStatus: {
          type: INFO,
          message: ''
        },
        ingestStatus: {
          type: INFO,
          message: ''
        },
        AD_SUPPORTED,
        FREE,
        ERROR,
        SUCCESS,
        NEWS_LIFESTYLE
      };
    },
    computed: {
      /**
       * Gets tags from combining secondary category, tertiary category and additional keywords
       * @returns {Array}
       */
      tags() {
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
      validForm() {
        const tertiaryCategory = this.highLevelCategory === NEWS_LIFESTYLE ? this.tertiaryCategory : true;

        return this.videoFile && this.videoName && this.shortDescription && this.station && this.highLevelCategory && this.secondaryCategory && tertiaryCategory && this.tags.length >= 2;
      }
    },
    watch: {
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
      this.tertiaryCategoryOptions = await tertiaryCategoryOptions();
    },
    methods: {
      /**
       * Set upload/ingest status on FE
       *
       * @param {string} alertType
       * @param {string} type
       * @param {string} message
       */
      updateStatus(alertType, type, message) {
        if (alertType === UPLOAD) {
          this.uploadStatus = { type, message };
        } else if (alertType === INGEST) {
          this.ingestStatus = { type, message };
        }
      },
      /**
       * Get file stream from file input
       *
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
       *
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
        this.updateStatus(UPLOAD, INFO, null);
        this.updateStatus(INGEST, INFO, null);
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
       * Init method to start video upload process
       *
       * @param {Object} event
       */
      uploadNewVideo(event) {
        event.preventDefault();
        this.loading = true;
        this.updateStatus(UPLOAD, INFO, null);
        this.updateStatus(INGEST, INFO, null);
        this.createBrightcoveVideoObj();
      },
      /**
       * Creates new video object in Brightcove
       *
       */
      async createBrightcoveVideoObj() {
        try {
          const { videoName, shortDescription, longDescription,
            station, highLevelCategory, secondaryCategory, tertiaryCategory, tags, adSupported } = this,
            { status, statusText, data } = await getFetchResponse('POST', '/brightcove/create', {
              videoName, shortDescription, longDescription, station, highLevelCategory,
              secondaryCategory, tertiaryCategory, tags, adSupported
            }, { 'Content-Type': 'application/json' } ),
            { signed_url, api_request_url, videoID } = data;

          if (status === 200 && signed_url && api_request_url && videoID) {
            this.uploadVideoToBrightcoveS3(signed_url, api_request_url, videoID);
          } else {
            this.loading = false;
            this.updateStatus(UPLOAD, ERROR, `Failed to create video -- ${ status } ${ statusText }`);
          }
        } catch(e) {
          this.loading = false;
          this.updateStatus(UPLOAD, ERROR, `Failed to create video. ${ e.message }`);
        }
      },
      /**
       * Uploads new video file to brightcove s3
       * using the signed url returned from brightcove's ingest api
       *
       * @param {string} signed_url
       * @param {string} api_request_url
       * @param {string} videoID
       */
      async uploadVideoToBrightcoveS3(signed_url, api_request_url, videoID) {
        try {
          const { videoFile } = this,
          { status, statusText } = await getFetchResponse('PUT', signed_url, videoFile, { 'Content-Type': '' });

          if (status === 200) {
            this.uploadS3VideoToBrightcove(api_request_url, videoID);
          } else {
            this.loading = false;
            this.updateStatus(UPLOAD, ERROR, `Failed to upload video to Brightcove S3 -- ${ status } ${ statusText }`);
          }
        } catch (e) {
          this.loading = false;
          this.updateStatus(UPLOAD, ERROR, `Failed to upload video to Brightcove S3. ${ e.message }`);
        }
      },
      /**
       * Uploads video file in brightcove s3
       * to Brightcove's video cloud
       *
       * @param {string} api_request_url
       * @param {string} videoID
       */
      async uploadS3VideoToBrightcove(api_request_url, videoID) {
        try {
          const { status, statusText, data } = await getFetchResponse('POST', '/brightcove/upload',
            { api_request_url, videoID }, { 'Content-Type': 'application/json' }),
            { video, jobID } = data;

          if (status === 200 && video && jobID) {
            this.uploadedVideo = video;
            this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.uploadedVideo });
            this.updateStatus(UPLOAD, SUCCESS, 'Successfully uploaded video. Go to "Update Video" tab to edit. Allow a few minutes for video renditions to be created.');
            this.getIngestStatus(jobID, videoID);
          } else {
            this.loading = false;
            this.updateStatus(UPLOAD, ERROR, `Failed to upload S3 video to BC -- ${ status } ${ statusText }`);
          }
        } catch (e) {
          this.loading = false;
          this.updateStatus(UPLOAD, ERROR, `Failed to upload S3 video to Brightcove. ${ e.message }`);
        }
      },
      /**
       * Retrieves job status of ingesting video from brightcove S3 to brightcove video object
       * Sets ingest status alert on FE
       *
       * @param {string} jobID
       * @param {string} videoID
       */
      getIngestStatus(jobID, videoID) {
        this.updateStatus(INGEST, INFO, 'Creating video renditions...');
        setTimeout(async () => {
          try {
            const { status, statusText, data: ingestStatus } = await getFetchResponse('POST', '/brightcove/ingestStatus',
              { jobID, videoID }, { 'Content-Type': 'application/json' }),
              { state } = ingestStatus;

            if (status === 200 && state) {
              if (['finished', 'failed'].includes(state)) {
                this.loading = false;
                this.updateStatus(INGEST, state === 'finished' ? SUCCESS : ERROR, `${ state.replace('f','F') } creating renditions!`)
                if (state === 'finished') {
                  this.getVideoObjWithVideoFile(videoID);
                } else {
                  this.updateStatus(INGEST, ERROR, 'Failed to ingest video');
                }
              } else {
                this.getIngestStatus(jobID, videoID);
              }
            } else {
              this.loading = false;
              this.updateStatus(INGEST, ERROR, `Failed to get ingest job status -- ${ status } ${ statusText }`);
            }
          } catch (e) {
            this.loading = false;
            this.updateStatus(INGEST, ERROR, `Failed to create renditions ${ e.message }`);
          }
        }, 5000);
      },
      /**
       * Gets video object from brightcove cloud
       *
       * @param {string} videoID
       */
      async getVideoObjWithVideoFile(videoID) {
        try {
          const { status, statusText, data: videoWithMedia } = await getFetchResponse('GET', `/brightcove/get?id=${videoID}`);

          if (status === 200 && videoWithMedia) {
            this.uploadedVideo = videoWithMedia;
            this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.uploadedVideo });
          } else {
            this.updateStatus(UPLOAD, ERROR, `Failed to get video after it was created -- ${ status } ${ statusText }`);
          }
        } catch(e) {
          this.updateStatus(UPLOAD, ERROR, `Failed to get video after it was created -- ${ e.message }`);
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
