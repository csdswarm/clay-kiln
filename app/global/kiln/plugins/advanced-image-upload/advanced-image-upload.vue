<!-- Advanced Image Upload -->
<docs>

  # Advanced Image Upload

  This Vue single file component is a Clay Kiln input that allows the editor to upload an image
  file directly to s3, or simply provide a url to a public image resource.

  The url that will be stored in the associated property of the component data, will be either
  the public url provided, or the url to the newly uploaded resource hosted on s3.

  More info: 
  https://claycms.gitbook.io/kiln/kiln-fundamentals/components/inputs
  https://github.com/clay/clay-kiln/tree/cd2c1fe88c15d5f6eef3ea52b3395c28e8f617ea/inputs

  ### Advanced Image Upload Arguments

  * **webLabel** - Web File text input label.
  * **webHelp** - Description / helper text for the web file text field.
  * **uploadLabel** - File Upload Button label.
  * **uploadHelp** - Description / helper text for the file upload button.
  * **s3Host** - The s3 host used to build the image resource URL that is actually stored. This host will be used to render the image tag publicly.

</docs>

<template>
  <div class="advanced-image-upload">
    <div v-if="imageUrl">
      <img class="attached-image" alt="attached image" :src="imageUrl" />
    </div>
    <div v-else>
      <div class="kiln-placeholder">
        <div class="placeholder-label"><span class="placeholder-text">No Image</span><div class="ui-ripple-ink"></div></div>
      </div>
    </div>
    <div class="web-file-container">
      <div class="web-file-text-input">
        <ui-textbox
          :autosize="false"
          :value="webFileUrl"
          :type="url"
          :multiLine="false"
          :invalid="!webFileUrlFieldIsValid"
          :label="args.webLabel"
          :floatingLabel="true"
          :help="args.webHelp"
          @input="updateWebFileUrl"
        ></ui-textbox>
      </div>
      <div class="web-file-done-button">
        <ui-icon-button
          type="primary"
          :color="iconButtonColor"
          :disabled="iconButtonDisabled"
          @click="webFileAttached"
          icon="done"
        ></ui-icon-button>
      </div>
    </div>
    <ui-fileupload ref="fileUploadButton" :label="args.uploadLabel" color="accent" :disabled="fileUploadButtonDisabled" accept="image/*" @change="localFileAttached"></ui-fileupload>
    <div class="ui-textbox__feedback" v-if="args.uploadHelp">
      <div class="ui-textbox__feedback-text">{{ args.uploadHelp }}</div>
    </div>
  </div>
</template>

<script>

import validator from 'validator'
import axios from 'axios'

const UiTextbox = window.kiln.utils.components.UiTextbox
const UiIconButton = window.kiln.utils.components.UiIconButton
const UiFileupload = window.kiln.utils.components.UiFileupload

export default {
  props: ['name', 'data', 'schema', 'args'],
  data() {
    return {
      imageUrl: this.data || '', // Set passed data "prop" as local data so it can be mutated. See https://vuejs.org/v2/guide/components-props.html#One-Way-Data-Flow
      webFileUrl: '',
      fileUploadButtonDisabled: false
    };
  },
  computed: {
    /**
     * 
     * Validates string in web file text input as url.
     * 
     * @returns {boolean} If url in web file text input is a valid url string.
     */
    webFileUrlFieldIsValid() {

      // Cachebusting dependencies
      const webFileUrl = this.webFileUrl

      // If url field is empty, that is valid. Else validate input as url.
      if (!webFileUrl) {
        return true
      } else {
        return validator.isURL(webFileUrl, {
          protocols: ['http','https'],
          require_protocol: true
        })
      }

    },
    /**
     * 
     * Determines web file "done" button color.
     * 
     * @returns {string}
     */
    iconButtonColor() {

      // Cachebusting dependencies
      const webFileUrl = this.webFileUrl
      const webFileUrlFieldIsValid = this.webFileUrlFieldIsValid

      // Only "activate" button with green color if field is filled with valid url.
      if (!webFileUrl) {
        return 'default'
      } else {
        return webFileUrlFieldIsValid ? 'green' : 'default'
      }

    },
    /**
     * 
     * Determines web file "done" button disabled/enabled.
     * 
     * @returns {boolean}
     */
    iconButtonDisabled() {

      // Cachebusting dependencies
      const webFileUrl = this.webFileUrl
      const webFileUrlFieldIsValid = this.webFileUrlFieldIsValid

      // If field is empty or invalid, disable "done" button.
      return (!webFileUrl || !webFileUrlFieldIsValid) ? true : false

    }
  },
  methods: {
    /**
     * 
     * Event handler that is fired when web file "done" button is pressed.
     * 
     * This simply takes the input of the web file text field, and saves it to
     * the assigned component data property. Afterwards the web file text field is reset.
     * 
     */
    webFileAttached() {

      // Use web file url field to set imageUrl.
      this.imageUrl = this.webFileUrl;

      // Set value of form to be the web file url.
      this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.webFileUrl });

      // Reset web file url field
      this.webFileUrl = '';

    },
    /**
     * 
     * Event handler that is fired when web file text field input is updated.
     * 
     * This simply maps the input of the text field to this component's appropriate data model.
     * 
     * @param {string} input - The contents of the web file text field.
     */
    updateWebFileUrl(input) {
      this.webFileUrl = input
    },
    /**
     * 
     * Event handler that is fired when an image file is attached via the file upload button.
     * 
     * Logic flow is: Filename and type of attached file is sent to backend in order to create
     * a pre-signed request url associated with the file. Signed url is sent back as response,
     * then signed url is used by client to directly upload attached file to s3. This client does
     * not need access to AWS creds, as the signed url acts as temporary uploading credentials.
     * 
     * After file is uploaded, the new s3 resource url is saved to the assigned component data 
     * property.
     * 
     * @param {array} files - FileList array of files.
     */
    localFileAttached(files) {

      // Disable file upload button while processing.
      this.fileUploadButtonDisabled = true;

      const file = files[0];

      // If file attached, exec upload logic.
      if (file) {

        /*
        Send file name and type to backend so backend can generate aws pre-signed request url.
        This allows us to keep our aws secret on the backend, while still uploading directly 
        from the client to s3. Actual s3 file key (aka file name) will be built on backend by processing 
        attached filename and appending a UUID to ensure there are no file collisions in the s3 bucket.
        */
        this.prepareFileForUpload(file.name, file.type)
          .then(data => {
            return this.execFileUpload(data.s3SignedUrl, file, data.s3FileType)
              .then(() => { return { bucket: data.s3Bucket, fileKey: data.s3FileKey }});
          })
          .then((s3) => {

            // Use custom domain for s3 host else default to standard amazon host.
            const s3Host = (this.args.s3Host) ? this.args.s3Host : 's3.amazonaws.com';

            // Build the full s3 resource url.
            const s3FileUrl = `https://${s3.bucket}.${s3Host}/${s3.fileKey}`;

            // Update imageUrl to point to new s3 file.
            this.imageUrl = s3FileUrl;

            // Set value of form to be the s3 file url.
            this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: s3FileUrl });

            this.webFileUrl = ''; // Reset web file attachment field
            this.fileUploadButtonDisabled = false; // Re-enable file upload button.

          });
      }
      
    },
    /**
     * 
     * Send file name and mime type to backend so backend can use AWS creds to generate aws pre-signed request url
     * associated with this file. This signed url will act as temporary AWS credentials that
     * the client will use to directly upload the file to s3.
     * 
     * @param {string} fileName - filename of attached file.
     * @param {string} fileType - MIME type of attached file.
     */
    prepareFileForUpload(fileName, fileType) {

      return axios.post('/AdvancedImageUpload', {
        fileName: fileName,
        fileType: fileType
      }).then(result => result.data);

    },
    /**
     * 
     * Upload a file directly to s3 using a pre-signed request url.
     * 
     * File object: https://developer.mozilla.org/en-US/docs/Web/API/File
     * 
     * @param {string} s3SignedUrl - The signed url used as temporary aws creds to process the direct s3 upload.
     * @param {File} file - File object associated with file upload input button.
     * @param {string} s3FileType - MIME type of file.
     */
    execFileUpload(s3SignedUrl, file, s3FileType) {

      return axios.put(s3SignedUrl, file, {
        headers: {
          'Content-Type': s3FileType
        }
      });

    }
  },
  components: {
    UiTextbox,
    UiIconButton,
    UiFileupload
  }
}
</script>