<!-- Bulk Image Upload -->

<template>
    <div class="bulk-image-upload">
        <div class="bulk-image-upload__status-message">{{ statusMessage }}</div>
        <ui-fileupload 
            class="bulk-image-upload__fileupload"
            multiple="true" 
            accept="image/*" 
            @change="selectFiles"
            ref="upload">Select images to upload</ui-fileupload>
        <div v-for="(file, index) in files" 
            :key="file.name" 
            class="bulk-image-upload__file"
            :class="file.status">
            <span>{{ file.name }}</span>
            <span>
                <ui-icon-button v-if="file.status === 'uploaded'" icon="check_circle_outline" type="secondary" color="white"></ui-icon-button>
                <ui-icon-button v-else-if="file.status === 'error'" icon="error_outline" type="secondary" color="white"></ui-icon-button>
                <ui-progress-circular color="white" v-else-if="status === 'uploading'"></ui-progress-circular>
                <ui-icon-button v-else icon="close" type="secondary" color="white" @click="removeFile(index)"></ui-icon-button>
            </span>
        </div>
        <ui-button buttonType="button" @click.stop="uploadFiles" class="bulk-image-upload__upload">Upload</ui-button>
    </div>
</template>

<script>

const { UiButton, UiFileupload, UiIconButton, UiProgressCircular } = window.kiln.utils.components;
const create = window.kiln.utils.create.default;
const { refProp } = window.kiln.utils.references;
const _uniqBy = require('lodash/uniqBy');
const { uploadFile } = require('../../../client/s3');

/**
 * Build structure of image component
 *
 * @param {string} url
 */
const buildImageComponent = url => ({name: 'image', data: {url}});
/**
 * Build structure of gallery-slide component
 *
 * @param {string} imageRef
 */
const buildGallerySlideComponent = imageRef => ({name: 'gallery-slide', data: { slideEmbed: [{[refProp]: imageRef[refProp]}]}});
/**
 * Filter out imageUrls that were not uploaded correctly
 * 
 * @param {string | object} imageUrl
 */
const filterErrors = imageUrl => !(imageUrl instanceof Error);
/**
 * Use kiln create method to create image components and then add the _ref to a gallery-slide
 *
 * @param {array} imageUrls
 */
const createGallerySlideComponents = async imageUrls => {
    const imageRefs = await create(imageUrls.filter(filterErrors).map(buildImageComponent));

    return imageRefs.map(buildGallerySlideComponent);
}
/**
 * Find the gallery instance on the current page
 *
 * @param {object} store
 */
const getGalleryInstance = (store) => 
    Object.keys(store.state.components)
        .find((key) => key.includes(`_components/gallery/instances`));

export default {
  props: ['name', 'data', 'schema', 'args'],
  data() {
      return {
          dest: this.args.dest,
          files: [],
          status: '',
          statusMessage: 'Please select up to 20 images to upload'
      }
  },
  methods: {
      /**
       * Clears the fileupload box
       * KeenUi v1.2 has a clear method, but kiln doesn't have it yet
       */
      clearFileUpload() {
          this.$refs.upload.hasSelection = false;
          this.$refs.upload.multiple = false;
      },
      /**
       * Remove file from selected list
       *
       * @param {number} index
       */
      removeFile(index) {
          this.files.splice(index, 1);
      },
      /**
       * Add selected files to waiting to upload list
       * Adds 'selected' status and limits to 20 files at once
       * @param {array} files
       */
      selectFiles(files) {
          this.files = _uniqBy(this.files
            .concat(Array.from(files)
            .map(file => ({file, name: file.name, status: 'selected'})))
            .slice(0, 20), 'name');
          this.statusMessage = `${this.files.length}/20 files selected`;
          this.clearFileUpload();
      },
      /**
       * Update the status of a file
       * 
       * @param {string} status
       * @param {number} index
       */
      updateFileStatus(status, index) {
          return (data) => {
            if (index) {
                this.files[index].status = status;
            } else {
                this.files = this.files.map(file => ({...file, status}));
            }
            return data;
          }
      },
      /**
       * Uploads the files to s3 and then creates and save gallery-slide components to the provided field
       */
      async uploadFiles() {
          this.status = 'uploading';
          return Promise.all(this.files.map(({file}, index) => 
            uploadFile(file)
                .then(({fileKey, host}) => `https://${host}/${fileKey}`)
                .then(this.updateFileStatus('uploaded', index))
                .catch(this.updateFileStatus('error', index))))
          .then(createGallerySlideComponents)
          .then(this.updateFileStatus('created'))
          .then(newGallerySlides =>
              this.$store.dispatch('addComponents', {
                  parentURI: getGalleryInstance(this.$store),
                  path: this.dest,
                  components: newGallerySlides
              })
          )
          .then(() => {
              this.$store.dispatch('showSnackbar', {
                  message: 'Images added to the gallery',
                  duration: 4000
              });
          })
      }
  },
  components: {
      UiButton,
      UiFileupload,
      UiIconButton,
      UiProgressCircular
  }
}
</script>
