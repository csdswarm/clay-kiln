<!-- Advanced Image Upload -->
<docs>

  # Advanced Image Upload

  This Vue single file component is a Clay Kiln input that allows the editor to upload an image
  file directly to s3, or simply provide a url to a public image resource.

  The url that will be stored in the associated property of the component data, will be the url
  to the newly uploaded resource hosted on s3.

  More info:
  https://claycms.gitbook.io/kiln/kiln-fundamentals/components/inputs
  https://github.com/clay/clay-kiln/tree/cd2c1fe88c15d5f6eef3ea52b3395c28e8f617ea/inputs

  ### Advanced Image Upload Arguments

  * **uploadLabel** - File Upload Button label.
  * **uploadHelp** - Description / helper text for the file upload button.
  * **maxEditorDisplayHeight** - height for when used in a complex list.

</docs>

<template>
  <div class="advanced-image-upload">
    <ui-fileupload ref="fileUploadButton" :label="args.uploadLabel" color="accent" :disabled="fileUploadButtonDisabled" accept="image/*" @change="localFileAttached"></ui-fileupload>
    <div class="ui-textbox__feedback" v-if="args.uploadHelp">
      <div class="ui-textbox__feedback-text">{{ args.uploadHelp }}</div>
    </div>
    <div v-if="imageUrl">
      <img 
          :class="['advanced-image-upload__attached-image', args.maxEditorDisplayHeight ? 'advanced-image-upload__attached-image--clamped-height' : '' ]"
          alt="attached image" 
          :src="imageUrl" 
          :style="args.maxEditorDisplayHeight ? 'max-height:' + args.maxEditorDisplayHeight : ''" />
    </div>
    <div v-else>
      <div class="advanced-image-upload__image-placeholder kiln-placeholder">
        <div class="placeholder-label"><span class="placeholder-text">No Image</span><div class="ui-ripple-ink"></div></div>
      </div>
    </div>
  </div>
</template>

<script>

import axios from 'axios'

const UiFileupload = window.kiln.utils.components.UiFileupload

export default {
  props: ['name', 'data', 'schema', 'args'],
  data() {
    return {
      imageUrl: this.data || '', // Set passed data "prop" as local data so it can be mutated. See https://vuejs.org/v2/guide/components-props.html#One-Way-Data-Flow
      fileUploadButtonDisabled: false
    };
  },
  methods: {
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
              .then(() => { return { host: data.s3CdnHost, fileKey: data.s3FileKey }});
          })
          .then((s3) => {

            // Build the full s3 image url.
            const s3ImageUrl = `https://${s3.host}/${s3.fileKey}`;

            // Update imageUrl to point to new s3 file.
            this.imageUrl = s3ImageUrl;

            // Set value of form to be the s3 file url.
            this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: s3ImageUrl });

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

      return axios.post('/advanced-image-upload', {
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
    UiFileupload
  }
}
</script>
