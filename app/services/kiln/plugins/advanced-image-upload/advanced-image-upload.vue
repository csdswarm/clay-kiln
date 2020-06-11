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
  * **enableDelete** - enables delete functionality.  'delete' in this context refers to the url field, not the image on s3.  By default this is false

</docs>

<template>
  <div class="advanced-image-upload">
    <ui-fileupload ref="fileUploadButton"
      :label="args.uploadLabel"
      color="accent"
      :disabled="fileUploadButtonDisabled"
      accept="image/*"
      @change="localFileAttached">
    </ui-fileupload>
    <p v-if="failedFileCheck" class="advanced-image-upload__file-check-error">Image is too small and does not meet design requirements (must be at least 430 x 430 pixels)</p>
    <ui-button v-if="showDelete"
      icon="delete"
      buttonType="button"
      type="secondary"
      color="red"
      @click="removeImageUrl">

      Remove
    </ui-button>
    <div class="ui-textbox__feedback" v-if="args.uploadHelp">
      <div class="ui-textbox__feedback-text">{{ args.uploadHelp }}</div>
    </div>
    <div v-if="imageUrl">
      <img
          :class="['advanced-image-upload__attached-image', { 'advanced-image-upload__attached-image--clamped-height': args.maxEditorDisplayHeight } ]"
          alt="attached image"
          :src="imageUrl"
          :style="args.maxEditorDisplayHeight ? 'max-height:' + args.maxEditorDisplayHeight : ''" />
    </div>
    <div v-else>
      <div class="advanced-image-upload__image-placeholder kiln-placeholder">
        <div class="placeholder-label">
          <span class="placeholder-text">No Image</span>
          <div class="ui-ripple-ink"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import { uploadFile } from '../../../client/s3'

const { UiFileupload, UiButton } = window.kiln.utils.components

export default {
  props: ['name', 'data', 'schema', 'args'],
  data() {
    return {
      imageUrl: this.data || '', // Set passed data "prop" as local data so it can be mutated. See https://vuejs.org/v2/guide/components-props.html#One-Way-Data-Flow
      fileUploadButtonDisabled: false,
      image: {
        size: '',
        width: '',
        height: ''
      },
      verifiedfile: false,
      failedFileCheck: false
    };
  },
  computed: {
    showDelete() {
      return this.data && this.args.enableDelete;
    },
  },
  methods: {
    /**
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
    async localFileAttached(files) {
      // Disable file upload button while processing.
      this.fileUploadButtonDisabled = true;
      const file = files[0]
      if(!file || file.type.indexOf('image/') !== 0) return;

      try {
        const image = await this.getImageDimensions(file);
        const valid = this.checkImageDimemsions(image);
        // If file attached, exec upload logic.
        if (file && valid) {
          /*
          Send file name and type to backend so backend can generate aws pre-signed request url.
          This allows us to keep our aws secret on the backend, while still uploading directly
          from the client to s3. Actual s3 file key (aka file name) will be built on backend by processing
          attached filename and appending a UUID to ensure there are no file collisions in the s3 bucket.
          */
          const s3 = await uploadFile(file);
          // Build the full s3 image url.
          this.setImageUrl(`https://${s3.host}/${s3.fileKey}`);
        }
      } catch (error) {
        console.log(error);
      } finally {
        this.fileUploadButtonDisabled = false; // Re-enable file upload button.
      }
    },
    setImageUrl(imageUrl) {
      // Update imageUrl to point to new s3 file.
      this.imageUrl = imageUrl;

      // Set value of form to be the s3 file url.
      this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: imageUrl });
    },
    removeImageUrl() {
      // keen-ui's file upload component doesn't expose a function to reset its
      //   state so we have to ref it directly.
      this.$refs.fileUploadButton.hasSelection = false;
      this.$refs.fileUploadButton.$refs.input.value = null;

      this.setImageUrl('');
    },
    getImageDimensions(file) {
      return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = evt => {
        const image = new Image();
        image.src = evt.target.result;
        image.onload = () => {
          resolve({width: image.width, height: image.height})
        }
      }
      reader.readAsDataURL(file);
      reader.onerror = evt => {
        console.error(evt);
        reject(new Error(evt))
      }

      })
    },
    checkImageDimemsions({width, height}) {
      const hero =  window.location.hash.indexOf("podcast-hero-carousel");
      if(hero <= 0) {
        this.failedFileCheck = false;
        return true;
      };
      if((width < 430) || (height < 430)) {
        this.failedFileCheck = true;
        this.fileUploadButtonDisabled = false;
        return false;
      }
      this.failedFileCheck = false;
      return true;
    }
  },
  components: {
    UiFileupload,
    UiButton
  }
}
</script>
