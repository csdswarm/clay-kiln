<!-- Station Theme Manager -->
<template>
  <div class="station-theme-manager">
    <h3>Station Theme Colors</h3>
    <div class="theme-color-input">
      <ui-textbox
        required
        :invalid="!isColorHex(primaryColor)"
        :error="colorHexError"
        floating-label
        label="Primary Color (Example: station nav, icons, hyperlink, etc)"
        v-model="primaryColor"
      ></ui-textbox>
      <ui-icon-button
        :tooltip="pickerTooltip"
        has-dropdown
        icon="colorize"
        size="normal"
        v-bind:style="{ 'background-color': primaryColor }"
      >
        <div class="color-picker-dropdown" slot="dropdown">
          <color-picker v-model="primaryColor"></color-picker>
        </div>
      </ui-icon-button>
    </div>
    <div class="theme-color-input">
      <ui-textbox
        required
        :invalid="!isColorHex(secondaryColor)"
        :error="colorHexError"
        floating-label
        label="Secondary Color (Example: station nav dropdown)"
        v-model="secondaryColor"
      ></ui-textbox>
      <ui-icon-button
        :tooltip="pickerTooltip"
        has-dropdown
        icon="colorize"
        size="normal"
        v-bind:style="{ 'background-color': secondaryColor }"
      >
        <div class="color-picker-dropdown" slot="dropdown">
          <color-picker v-model="secondaryColor"></color-picker>
        </div>
      </ui-icon-button>
    </div>
    <div class="theme-color-input">
      <ui-textbox
        required
        :invalid="!isColorHex(tertiaryColor)"
        :error="colorHexError"
        floating-label
        label="Tertiary Color (Example: Listen Live button)"
        v-model="tertiaryColor"
      ></ui-textbox>
      <ui-icon-button
        :tooltip="pickerTooltip"
        has-dropdown
        icon="colorize"
        size="normal"
        v-bind:style="{ 'background-color': tertiaryColor }"
      >
        <div class="color-picker-dropdown" slot="dropdown">
          <color-picker v-model="tertiaryColor"></color-picker>
        </div>
      </ui-icon-button>
    </div>
    <div class="theme-color-input">
      <ui-textbox
        required
        :invalid="!isColorHex(primaryFontColor)"
        :error="colorHexError"
        floating-label
        label="Primary Font Color (Example: station nav text)"
        v-model="primaryFontColor"
      ></ui-textbox>
      <ui-icon-button
        :tooltip="pickerTooltip"
        has-dropdown
        icon="colorize"
        size="normal"
        v-bind:style="{ 'background-color': primaryFontColor }"
      >
        <div class="color-picker-dropdown" slot="dropdown">
          <color-picker v-model="primaryFontColor"></color-picker>
        </div>
      </ui-icon-button>
      <div class="station-theme-manager__color-preview"
        v-bind:style="{ color: primaryFontColor, 'background-color': primaryColor }">
        <span v-bind:key="font" v-for="font in fonts">
          Preview primary font color in {{ font }}
        </span>
      </div>
    </div>
    <div class="theme-color-input">
      <ui-textbox
        required
        :invalid="!isColorHex(secondaryFontColor)"
        :error="colorHexError"
        floating-label
        label="Secondary Font Color (Example: station nav dropdown text)"
        v-model="secondaryFontColor"
      ></ui-textbox>
      <ui-icon-button
        :tooltip="pickerTooltip"
        has-dropdown
        icon="colorize"
        size="normal"
        v-bind:style="{ 'background-color': secondaryFontColor }"
      >
        <div class="color-picker-dropdown" slot="dropdown">
          <color-picker v-model="secondaryFontColor"></color-picker>
        </div>
      </ui-icon-button>
      <div class="station-theme-manager__color-preview"
        v-bind:style="{ color: secondaryFontColor, 'background-color': secondaryColor }">
        <h3>Can be the same as primary font color. It can be different depending on how light or dark the primary, secondary and tertiary colors are</h3>
        <span v-bind:key="font" v-for="font in fonts">
          Preview secondary font color in {{ font }}
        </span>
      </div>
    </div>
    <div class="button-container">
      <ui-button
        size="large"
        :loading="loading"
        @click="updateTheme"
        :disabled="!validForm"
      >Save</ui-button>
      <ui-button
        size="large"
        iconPosition="right"
        @click="undoChanges"
      >Undo Changes</ui-button>
    </div>
    <ui-alert
      v-if="updateStatus.message"
      :type="updateStatus.type"
      @dismiss="updateStatus.message = ''"
    >{{ updateStatus.message }}</ui-alert>
  </div>
</template>

<script>
  import axios from 'axios';

  const {
      UiButton,
      UiProgressCircular,
      UiTextbox,
      UiAlert,
      UiIconButton
    } = window.kiln.utils.components,
    ColorPicker = require('vue-iro-color-picker');

  export default {
    data() {
      return {
        theme: null,
        primaryColor: '',
        secondaryColor: '',
        tertiaryColor: '',
        primaryFontColor: '',
        secondaryFontColor: '',
        pickerTooltip: 'color picker',
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
        colorHexError: 'Enter a valid color hex. Format should be # followed by 3 or 6 letters (a-f) or numbers'
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
        return [
          this.primaryColor,
          this.secondaryColor,
          this.tertiaryColor,
          this.primaryFontColor,
          this.secondaryFontColor
        ].every(this.isColorHex);
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
          await axios({
            method: this.theme ? 'put' : 'post',
            url: `/station-theme/${ window.kiln.locals.station.site_slug }`,
            data: { primaryColor, secondaryColor, tertiaryColor, primaryFontColor, secondaryFontColor }
          });

          this.loading = false;
          this.theme = { primaryColor, secondaryColor, tertiaryColor, primaryFontColor, secondaryFontColor };
          this.updateStatus = {type: 'success', message: 'Station theme updated.'};
        } catch({ response }) {
          this.loading = false;
          this.updateStatus = {type: 'error', message: `Could not update theme. ${ response.data }`};
        }
      },
      /**
       * Retrieve theme colors for station from postgres db
      */
      async loadTheme() {
        this.loading = true;
        try {
          const { data } = await axios.get(`/station-theme/${ window.kiln.locals.station.site_slug }`);

          this.loading = false;
          this.theme = data;
          this.primaryColor = data.primaryColor;
          this.secondaryColor = data.secondaryColor;
          this.tertiaryColor = data.tertiaryColor;
          this.primaryFontColor = data.primaryFontColor;
          this.secondaryFontColor = data.secondaryFontColor;
        } catch({ response }) {
          this.loading = false;
          this.updateStatus = {type: 'error', message: `Could not fetch theme. ${ response.data }`};
        }
      },
      /**
       * Resets all fields to previously stored colors
      */
      undoChanges() {
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
      }
    },
    components: {
        UiButton,
        UiProgressCircular,
        UiTextbox,
        UiAlert,
        UiIconButton,
        'color-picker': ColorPicker
    }
  }
</script>
