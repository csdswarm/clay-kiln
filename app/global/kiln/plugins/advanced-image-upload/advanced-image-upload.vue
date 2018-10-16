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
    iconButtonDisabled() {

      // Cachebusting dependencies
      const webFileUrl = this.webFileUrl
      const webFileUrlFieldIsValid = this.webFileUrlFieldIsValid

      // If field is empty or invalid, disable "done" button.
      return (!webFileUrl || !webFileUrlFieldIsValid) ? true : false

    }
  },
  methods: {
    webFileAttached() {

      // Use web file url field to set imageUrl.
      this.imageUrl = this.webFileUrl;

      // Set value of form to be the web file url.
      this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.webFileUrl });

      // Reset web file url field
      this.webFileUrl = '';

    },
    updateWebFileUrl(input) {
      this.webFileUrl = input
    },
    localFileAttached(files) {

      // Disable file upload button while processing.
      this.fileUploadButtonDisabled = true;

      const file = files[0];

      // If file attached, exec upload logic.
      if (file) {

        // Send file name and type to backend so backend can generate aws pre-signed request url.
        // This allows us to keep our aws secret on the backend, while still uploading directly 
        // from the client to s3. Actual s3 file key (aka file name) will be built on backend by processing 
        // attached filename and appending a UUID to ensure there are no file collisions in the s3 bucket.
        this.prepareFileForUpload(file.name, file.type)
          .then(data => {
            return this.execFileUpload(data.s3SignedUrl, file, data.s3FileType).then(() => { return { bucket: data.s3Bucket, fileKey: data.s3FileKey }});
          })
          .then((s3) => {

            // Use custom domain for s3 host else default to standard amazon host.
            const s3Host = (this.args.s3Host) ? this.args.s3Host : 's3.amazonaws.com';

            // Build the full s3 resource url.
            const s3FileUrl = `https://${s3.bucket}.${s3Host}/${s3.fileKey}`

            // Update imageUrl to point to new s3 file.
            this.imageUrl = s3FileUrl;

            // Set value of form to be the s3 file url.
            this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: s3FileUrl });

            this.webFileUrl = ''; // Reset web file attachment field
            this.fileUploadButtonDisabled = false; // Re-enable file upload button.

          });
      }
      
    },
    prepareFileForUpload(fileName, fileType) {

      return axios.post('/AdvancedImageUpload', {
        fileName: fileName,
        fileType: fileType
      }).then(result => result.data);

    },
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