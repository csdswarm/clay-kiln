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
    <input :name="name" type="hidden" :value="value">
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
      imageUrl: this.data || '', // Set passed data "prop" as local value so it can be mutated. See https://vuejs.org/v2/guide/components-props.html#One-Way-Data-Flow
      webFileUrl: '',
      fileUploadButtonDisabled: false
    };
  },
  computed: {
    value() {
      return this.imageUrl === null || typeof this.imageUrl === 'undefined' ? '' : String(this.imageUrl)
    },
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

      return (!webFileUrl || !webFileUrlFieldIsValid) ? true : false

    }
  },
  methods: {
    webFileAttached() {
      this.imageUrl = this.webFileUrl;
      this.webFileUrl = '';
    },
    updateWebFileUrl(input) {
      this.webFileUrl = input
    },
    localFileAttached(files) {

      this.fileUploadButtonDisabled = true;

      const file = files[0];

      if (file) {
        this.prepareFileForUpload(file.name, file.type)
          .then(data => {
            return this.execFileUpload(data.s3SignedUrl, file, data.s3FileType).then(() => { return { bucket: data.s3Bucket, fileKey: data.s3FileKey }});
          })
          .then((s3) => {

            // Set value of form to be the s3 file.
            this.imageUrl = `https://${s3.bucket}.s3.amazonaws.com/${s3.fileKey}`;

            // Reset web file attachment form
            this.webFileUrl = '';
            this.fileUploadButtonDisabled = false;

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