<docs>
  # Station Settings
</docs>

<template>
  <div class="station-settings">
    <h3 class="station-settings__main-title">Options:</h3>
    <form>

      <div class="station-settings__form-group station-settings__form-group--global-sponsorship">
        <UiCheckbox
          label="Enable Global Sponsorship"
          v-model="stationOptions.isGlobalSponsorshipEnabled"
          @change="onGlobalSponsorshipChange"
        />
      </div>

      <div class="station-settings__form-group station-settings__form-group--favicon">
        <div class="station-settings__form-group-left">
          <div class="station-settings__form-group-title">Station Favicon:</div>
          <AdvancedImageUploader
            name="favicon"
            :data="stationOptions.favicon"
            :schema="{}"
            :args="faviconArgs"
          />
        </div>
        <div class="station-settings__form-group-right">
          <div class="station-settings__favicon-img-wrap"
            v-for="(size, index) in faviconDisplaySizes" :key="index"
            :style="{ height: size + 'px', width: size + 'px', fontSize: 16/(index+1) + 'px' }"
            :data-content="size + 'x' + size"
          >
            <img class="station-settings__favicon-img" :src="stationOptions.favicon" >
          </div>
        </div>
      </div>

    </form>
  </div>
</template>


<script>
import axios from "axios";

const { UiCheckbox } = window.kiln.utils.components,
  stationOptionsEndpoint = "/rdc/station-options/",
  AdvancedImageUploader = require("../advanced-image-upload/advanced-image-upload.vue"),
  MIN_FAVICON_WIDTH = 180,
  MIN_FAVICON_HEIGHT = 180,
  MAX_DISPLAY_HEIGHT = MIN_FAVICON_HEIGHT/2;

export default {
  data() {
    return {
      stationOptions: {
        ...window.kiln.locals.stationOptions,
      }
    };
  },
  props: {
    stationName: String,
    stationLogo: String,
    stationId: String,
  },
  methods: {
    showSnack(message, duration = 4000) {
      this.$store.dispatch("showSnackbar", {
        message,
        duration: 4000,
      });
    },
    handleError(err, duration = 4000) {
      console.error(err);
      this.showSnack(`Error: ${err.message}`);
    },
    onGlobalSponsorshipChange(e) {
      this.saveStationOptions(
        `Station Enable Global Sponsorship set to: ${this.stationOptions.isGlobalSponsorshipEnabled}`
      );
    },
    onFaviconChange(err, imgUrl) {
      if (!err) {
        this.stationOptions.favicon = imgUrl;
        this.stationOptions = {
          ...this.stationOptions
        }
        this.saveStationOptions(`Station Favicon Saved`);
      } else {
        this.showSnack(err.message);
      }
    },
    saveStationOptions(snackMessage) {
      const putData = {
        ...this.stationOptions,
      };
      axios
        .put(`${stationOptionsEndpoint}${this.stationId}`, putData)
        .then((response) => {
          this.showSnack(snackMessage);
          window.kiln.locals.stationOptions = {
            ...this.stationOptions,
          };
        })
        .catch((err) => {
          this.handleError(err);
          this.stationOptions = {
            ...window.kiln.locals.stationOptions,
          };
        });
    },
    validateFaviconSize(image) {
      if (image.width <  MIN_FAVICON_WIDTH || image.height < MIN_FAVICON_HEIGHT) {
        this.handleError(new Error(`Image must be a minimum of: ${MIN_FAVICON_WIDTH}x${MIN_FAVICON_HEIGHT}`, 6000));
        return false;
      } else {
        return true;
      }
    }
  },
  computed: {
    faviconArgs() {
      return {
        uploadLabel: 'upload favicon',
        uploadHelp: `Image must be a minimum of: ${MIN_FAVICON_WIDTH}x${MIN_FAVICON_HEIGHT}`,
        maxEditorDisplayHeight: `${MIN_FAVICON_HEIGHT}px`,
        uploadCallback: this.onFaviconChange,
        additionNonKilnValidators: [ this.validateFaviconSize ]
      }
    },
    faviconRightStyle() {
      return `flex-basis: ${MAX_DISPLAY_HEIGHT}px;`;
    },
    faviconImgWrapStyle() {
      return `min-height: ${MAX_DISPLAY_HEIGHT}px;`;
    },
    faviconDisplaySizes() {
      return [180, 90, 45, 24, 16];
    }
  },
  components: {
    AdvancedImageUploader,
    UiCheckbox,
  },
};
</script>