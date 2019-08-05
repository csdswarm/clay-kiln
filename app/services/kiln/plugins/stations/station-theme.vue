<!-- Station Theme Manager -->
<template>
  <div class="station-theme-manager">
    <h3>Station Theme Colors</h3>
    <ui-textbox
      required
      :invalid="!isColorHex"
      :error="colorHexError"
      floating-label
      label="Primary Color"
      :model="primaryColor"
    >
      <color-picker :model="primaryColor"></color-picker>
      <div class="station-theme-manager__color-preview"
      :style="{ background: primaryColor }"></div>
    </ui-textbox>
    <ui-textbox
      required
      :invalid="!isColorHex"
      :error="colorHexError"
      floating-label
      label="Secondary Color"
      :model="secondaryColor"
    >
      <div class="station-theme-manager__color-preview"
      :style="{ background: secondaryColor }"></div>
    </ui-textbox>
    <ui-textbox
      required
      :invalid="!isColorHex"
      :error="colorHexError"
      floating-label
      label="Tertiary Color"
      :model="tertiaryColor"
    >
      <div class="station-theme-manager__color-preview"
      :style="{ background: tertiaryColor }"></div>
    </ui-textbox>
    <ui-textbox
      required
      :invalid="!isColorHex"
      :error="colorHexError"
      floating-label
      label="Primary Font Color"
      :model="primaryFontColor"
    >
      <div class="station-theme-manager__color-preview"
      :style="{ color: primaryFontColor }">
        <span :for="font in fonts">Preview primary font color in {{ font }}</span>
      </div>
    </ui-textbox>
    <ui-textbox
      required
      :invalid="!isColorHex"
      :error="colorHexError"
      floating-label
      label="Secondary Font Color"
      :model="secondaryFontColor"
    >
      <div class="station-theme-manager__color-preview"
      :style="{ color: secondaryFontColor }">
        <span :for="font in fonts">Preview secondary font color in {{ font }}</span>
      </div>
    </ui-textbox>
    <div class="button-container">
      <ui-button
        size="large"
        :loading="loading"
        @click="updateTheme"
        :disabled="!validForm"
      >Update</ui-button>
      <ui-button
        size="large"
        buttonType="reset"
        iconPosition="right"
        @click="resetForm"
      >Reset Fields</ui-button>
    </div>
    <ui-alert
      :if="updateStatus.message"
      :type="updateStatus.type"
    >{{ updateStatus.message }}</ui-alert>
  </div>
</template>

<script>
  require('isomorphic-fetch');
  const {
      UiButton,
      UiProgressCircular,
      UiTextbox,
      UiAlert
    } = window.kiln.utils.components,
    { ColorPicker } = require('vue-color-picker-wheel'),
    { getFetchResponse } = require('../utils/fetch');

  export default {
    data() {
      return {
        theme: null,
        primaryColor: '',
        secondaryColor: '',
        tertiaryColor: '',
        primaryFontColor: '',
        secondaryFontColor: '',
        loading: false,
        updateStatus: {
          type: '',
          message: ''
        },
        fonts: [
          'CircularStd-Black',
          'CircularStd-BlackItalic',
          'CircularStd-Book',
          'CircularStd-BookItalic',
          'CircularStd-Medium',
          'CircularStd-MediumItalic',
          'ProximaNova-Bold',
          'ProximaNova-BoldIt',
          'ProximaNova-Light',
          'ProximaNova-LightIt',
          'ProximaNova-Regular',
          'ProximaNova-RegularIt'
        ],
        colorHexError: 'Not a valid color hex. Format should be # followed by 3 or 6 letters or numbers'
      }
    },
    /**
     * Load current theme when component is created
    */
    created() {
      this.loadTheme();
    },
    computed: {
      /**
       * Validator for form. Valid when all fields are truthy.
      */
      validForm() {
        return this.primaryColor && this.secondaryColor && this.tertiaryColor && this.primaryFontColor && this.secondaryFontColor;
      }
    },
    methods: {
      /**
       * Validator for color hexes
       *
       * @param {string} value
      */
      isColorHex(value) {
        const colorHex = RegExp('^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$');

        return colorHex.test(value);
      },
      /**
       * Upload or update theme colors for station in postgres db
      */
      async updateTheme() {
        this.updateStatus = {type: '', message: ''};
        this.loading = true;

        const { primaryColor, secondaryColor, tertiaryColor, primaryFontColor, secondaryFontColor } = this;

        try {
          const { status, statusText, data: theme } = await getFetchResponse('POST',
            `/station-theme/${ window.kiln.locals.station.id }`,
            { primaryColor, secondaryColor, tertiaryColor, primaryFontColor, secondaryFontColor });

          this.loading = false;
          if (status >= 200 && status < 300) {
            this.updateStatus = {type: 'success', message: 'Station theme updated.'}
          } else {
            this.updateStatus = {type: 'error', message: `Could not get theme. ${ status }: ${ statusText }`}
          }
        } catch(e) {
          this.loading = false;
          this.updateStatus = {type: 'error', message: `Could not get theme. ${ e }`}
        }
      },
      /**
       * Retrieve theme colors for station from postgres db
      */
      async loadTheme() {
        this.loading = true;
        try {
          const { status, statusText, data: theme } = await getFetchResponse('GET', `/station-theme/${ window.kiln.locals.station.id }`);

          this.loading = false;
          if (status >= 200 && status < 300) {
            this.theme = theme;
            this.primaryColor = theme.primaryColor;
            this.secondaryColor = theme.secondaryColor;
            this.tertiaryColor = theme.tertiaryColor;
            this.primaryFontColor = theme.primaryFontColor;
            this.secondaryFontColor = theme.secondaryFontColor;
          } else {
            this.updateStatus = {type: 'error', message: `Could not get theme. ${ status }: ${ statusText }`}
          }
        } catch(e) {
          this.loading = false;
          this.updateStatus = {type: 'error', message: `Could not get theme. ${ e }`}
        }
      },
      /**
       * Resets all fields to previously stored colors or default
      */
      resetForm() {
        this.loading = false;
        this.updateStatus = {
          type: '',
          message: ''
        };
        this.primaryColor = this.theme ? this.theme.primaryColor : '';
        this.secondaryColor = this.theme ? this.theme.secondaryColor : '';
        this.tertiaryColor = this.theme ? this.theme.tertiaryColor : '';
        this.primaryFontColor = this.theme ? this.theme.primaryFontColor : '';
        this.secondaryFontColor = this.theme ? this.theme.secondaryFontColor : '';
      },
    },
    components: {
        UiButton,
        UiProgressCircular,
        UiTextbox,
        UiAlert,
        ColorPicker
    }
  }
</script>
