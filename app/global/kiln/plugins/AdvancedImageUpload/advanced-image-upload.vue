<!-- Advanced Image Upload -->
<docs>

  # Advanced Image Upload

  This Vue single file component is a Clay Kiln input that allows advanced image upload capabilities.

  Using this component, an image file can be uploaded to a specific s3 bucket via either direct
  file upload, or alternatively, supplying a url to a public image resource and clicking attach from web button. 
  If a url is supplied, the linked image will be downloaded, then cached to the same specified s3 bucket.

  The url to the uploaded s3 image resource will be stored in the "url" property of the component data.

  More info: 
  https://claycms.gitbook.io/kiln/kiln-fundamentals/components/inputs
  https://github.com/clay/clay-kiln/tree/cd2c1fe88c15d5f6eef3ea52b3395c28e8f617ea/inputs

</docs>

<template>
  <div class="advanced-image-upload">
    <div v-if="imageUrl && imageStoredToS3">
      <img alt="attached image" :src="imageUrl" style="width: 90%;" />
    </div>
    <div v-else>
      <div class="kiln-placeholder" style="min-height: 25px;">
        <div class="placeholder-label"><span class="placeholder-text">No Image</span><div class="ui-ripple-ink"></div></div>
      </div>
    </div>
    <ui-textbox 
      style="margin: 0 0 16px 0;"
      :autosize="false"
      :value="value"
      :type="url"
      :multiLine="false"
      :invalid="!urlFieldIsValid"
      :label="args.webLabel"
      :floatingLabel="false"
      :help="args.webHelp"
      @input="updateUrl"
      @keydown-enter="closeFormOnEnter"
    ></ui-textbox>
    <ui-icon-button
      type="primary"
      :color="iconButtonColor"
      :disabled="iconButtonDisabled"
      :loading="downloadingImageFile"
      @click="downloadImage"
      icon="cloud_download"
    ></ui-icon-button>
    <br /><!-- remove me after styling -->
    <ui-fileupload color="accent" :name="name" :label="args.uploadLabel" accept="image/*" @change="update"></ui-fileupload>
    <div class="ui-textbox__feedback" v-if="args.uploadHelp">
      <div class="ui-textbox__feedback-text">{{ args.uploadHelp }}</div>
    </div>
  </div>
</template>

<script>

import _ from 'lodash'
import validator from 'validator'

const UiTextbox = window.kiln.utils.components.UiTextbox
const UiIconButton = window.kiln.utils.components.UiIconButton
const UiFileupload = window.kiln.utils.components.UiFileupload

export default {
  props: ['name', 'data', 'schema', 'args'],
  data() {
    return {
      imageUrl: this.data, // Set passed data "prop" as local value so it can be mutated. See https://vuejs.org/v2/guide/components-props.html#One-Way-Data-Flow
    };
  },
  computed: {
    value() {
      return this.imageUrl === null || typeof this.imageUrl === 'undefined' ? '' : String(this.imageUrl)
    },
    urlFieldIsValid() {

      // Cachebusting dependencies
      const imageUrl = this.imageUrl

      // If url field is empty, that is valid. Else validate input as url.
      if (!imageUrl) {
        return true
      } else {
        return validator.isURL(this.imageUrl, {
          protocols: ['http','https'],
          require_protocol: true
        })
      }

    },
    iconButtonColor() {

      // Cachebusting dependencies
      const imageUrl = this.imageUrl
      const validUrlField = this.urlFieldIsValid

      if (!imageUrl) {
        return 'default'
      } else {
        return validUrlField ? 'green' : 'default'
      }

    },
    iconButtonDisabled() {

      // Cachebusting dependencies
      const imageUrl = this.imageUrl
      const validUrlField = this.urlFieldIsValid

      return (!imageUrl || !validUrlField) ? true : false

    },
    imageStoredToS3() {

      // TODO - this logic needs to be more advanced. 
      // It should check if passed data prop matches imageUrl to see if imageUrl has mutated
      // since we will need further logic in that scenario.

      // Cachebusting dependencies
      const imageUrl = this.imageUrl

      return /amazonaws/.test(imageUrl) // TODO - update me to test against actual s3 bucket host.

    },
    downloadingImageFile() {
      return false
    }
  },
  methods: {
    updateUrl(input) {
      console.log(input)
      this.imageUrl = input

    },
    downloadImage() {
      console.log(`downloading: ${this.imageUrl}`)
      this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.imageUrl })
    },
    closeFormOnEnter(e) {
      console.log('ENTER WAS PRESSED')
      
    },
    update(files) {

      console.log(files, 'files')

      // const file = _.head(files),
      //   reader = new FileReader(),
      //   store = this.$store;
      // reader.readAsText(file);
      // reader.onload = (readEvent) => {
      //   const csvData = _.get(readEvent, 'target.result'),
      //     parsed = toObject(csvData, {
      //       delimiter: this.args.delimiter || ',',
      //       quote: this.args.quote || '"'
      //     });
      //   this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: parsed });
      //   this.buttonLabel = 'CSV File Uploaded';
      // };
      // reader.onerror = () => {
      //   store.dispatch('showSnackbar', `Unable to read ${file.fileName}`);
      // };
    }
  },
  components: {
    UiTextbox,
    UiIconButton,
    UiFileupload
  }
}
</script>

<style>

</style>