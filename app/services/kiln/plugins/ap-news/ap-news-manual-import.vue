<!-- AP Manual Import -->
<template>
  <div class="ap-media-manual-import">
    <ui-checkbox-group
      ref="checkboxGroup"
      v-show="entitlements.length"
      :options="formattedOptions"
      v-model="selectedEntitlements"
      class="ap-media-manual-import__entitlement"
      @change="searchContent"
    >
      <h3 class="ap-media-manual-import__entitlement--title">Entitlement</h3>
    </ui-checkbox-group>
    <ui-textbox
      class="ap-media-manual-import__entitlement--filter"
      icon="search"
      placeholder="Search"
      v-model="filter"
      @change="searchContent"
    ></ui-textbox>
    <ui-progress-circular
      color="primary"
      v-show="isLoading"
      style="width: 100%; height: 44px;"
    ></ui-progress-circular>
    <div
      v-show="items.length > 0"
      class="page-list-readout ap-media-manual-import__list"
    >
      <div
        class="page-list-item ap-media-manual-import__list-item"
        :class="{
          'ap-media-manual-import__list-item--selected':
            item.headline === article.headline,
        }"
        @click="selectArticle(item)"
        :key="idx"
        v-for="(item, idx) in items"
      >
        <div class="page-list-item-title">{{ item.headline }}</div>
        <div class="page-list-item-status">
          <a :href="`https://apnews.com/${item.altids.itemid}`" target="_blank"
            >View</a
          >
          <span>{{ formatStatusTime(item.versioncreated) }}</span>
        </div>
      </div>
    </div>

    <div v-if="article" class="ap-media-manual-import__mapping">
      <div class="ap-media-manual-import__mapping--options">
        <ui-select
          placeholder="Select station"
          has-search
          v-model="station"
          :options="stationList"
          @change="fetchStationFronts"
          class="ap-media-manual-import__mapping--selectors"
        ></ui-select>
        <ui-select
          ref="primarySectionFrontSelect"
          placeholder="Select primary section front"
          :options="sectionFronts.primarySectionFronts"
          v-model="primarySectionFront"
          class="ap-media-manual-import__mapping--selectors"
        ></ui-select>
        <ui-select
          ref="secondarySectionFrontSelect"
          placeholder="Select secondary section front"
          :options="sectionFronts.secondarySectionFronts"
          v-model="secondarySectionFront"
          class="ap-media-manual-import__mapping--selectors"
        ></ui-select>
      </div>
      <div class="ap-media-manual-import__mapping--buttons">
        <ui-button @click="clearSelections" color="default">Clear</ui-button>
        <ui-button
          @click="importContent"
          :disabled="!enableImport"
          :loading="isSubmitting"
          color="primary"
          >Import</ui-button
        >
      </div>
    </div>
  </div>
</template>

<script>
const {
  UiTextbox,
  UiCheckboxGroup,
  UiSelect,
  UiProgressCircular,
  UiButton,
} = window.kiln.utils.components;
import axios from "axios";
import moment from "moment";

const AP_MEDIA_API_SEARCH = "/rdc/ap-subscriptions/search";
const AP_MEDIA_API_IMPORT = "/rdc/ap-subscriptions/manual-import";

export default {
  name: "ap-media-manual-import-import",
  props: ["entitlements"],
  data() {
    return {
      isLoading: false,
      isSubmitting: false,
      filter: "",
      selectedEntitlements: [],
      items: [],
      article: "",
      station: "",
      primarySectionFront: "",
      secondarySectionFront: "",
      sectionFronts: {
        primarySectionFronts: [],
        secondarySectionFronts: [],
      },
    };
  },
  components: {
    UiTextbox,
    UiCheckboxGroup,
    UiSelect,
    UiProgressCircular,
    UiButton,
  },
  computed: {
    formattedOptions() {
      return this.entitlements.map((entitlement) => {
        return {
          label: entitlement.name,
          value: entitlement.value,
          class: "ap-media-manual-import__entitlement--option",
        };
      });
    },
    stationList() {
      return Object.values(window.kiln.locals.stationsIHaveAccessTo).map(
        (station) => {
          return {
            label: `${station.name} (${station.callsign})`,
            value: station.slug,
          };
        }
      );
    },
    enableImport() {
      return this.station && this.primarySectionFront;
    },
  },
  methods: {
    selectArticle(article) {
      this.article = article;
    },
    clearSelections() {
      this.filter = "";
      this.article = "";
      this.$refs.checkboxGroup.reset();
      this.$refs.primarySectionFrontSelect.reset();
      this.$refs.secondarySectionFrontSelect.reset();
      this.items = [];
      this.station = "";
      this.primarySectionFront = "";
      this.secondarySectionFront = "";
    },
    stations() {
      return Object.values(window.kiln.locals.stationsIHaveAccessTo).map(
        (station) => {
          return {
            label: `${station.name} (${station.callsign})`,
            value: station.slug,
          };
        }
      );
    },
    formatStatusTime(date) {
      date = date ? new Date(date) : null;
      return moment(date).fromNow();
    },
    mapToOptions(item) {
      return {
        label: item.name,
        value: item.value,
      };
    },
    async getList(listName) {
      try {
        const response = await axios.get(`/_lists/${listName}`);

        return response.data || [];
      } catch (err) {
        console.log(`An error ocurred while fetching /_lists/${listName}`, err);
        return [];
      }
    },
    async fetchStationFronts(station) {
      const stationSlug = station.value ? `${station.value}-` : "";

      // Reset selectors and state.
      this.sectionFronts.primarySectionFronts = [];
      this.sectionFronts.secondarySectionFronts = [];
      this.$refs.primarySectionFrontSelect
        ? this.$refs.primarySectionFrontSelect.reset()
        : null;
      this.$refs.secondarySectionFrontSelect
        ? this.$refs.secondarySectionFrontSelect.reset()
        : null;

      try {
        const primarySectionFronts = await this.getList(
          `${stationSlug}primary-section-fronts`
        );
        const secondarySectionFronts = await this.getList(
          `${stationSlug}secondary-section-fronts`
        );

        this.sectionFronts.primarySectionFronts = primarySectionFronts.map(
          this.mapToOptions
        );
        this.sectionFronts.secondarySectionFronts = secondarySectionFronts.map(
          this.mapToOptions
        );
      } catch (err) {
        console.log(
          `An error ocurred while fetching section fronts for ${stationSlug}`,
          err
        );
      }
    },
    async searchContent() {
      // TODO: Hit the BE Service instead of the API Directly.
      this.isLoading = true;
      try {
        const filterConditions = [
          `${
            this.selectedEntitlements.length
              ? `productid:(${this.selectedEntitlements.join(" OR ")})`
              : ""
          }`,
          `${this.filter ? `headline:${this.filter}` : ""}`,
        ]
          .filter((item) => item)
          .join(" AND ");

        const response = await axios.get(AP_MEDIA_API_SEARCH, {
          params: {
            q: filterConditions,
          },
        });
        this.items = response.data;
      } catch (err) {
        console.log("Something went wrong while fetching content", err);
      } finally {
        this.isLoading = false;
      }
    },

    async importContent() {
      const payload = {
        apMeta: this.article,
        stationMappings: {
          [this.station.value]: {
            sectionFront: this.primarySectionFront.value,
            secondarySectionFront: this.secondarySectionFront.value,
          },
        },
        locals: window.kiln.locals,
      };
      try {
        this.isSubmitting = true;
        const response = await axios.post(AP_MEDIA_API_IMPORT, {
          apMeta: this.article,
          stationMappings: {
            [this.station.value]: {
              sectionFront: this.primarySectionFront.value,
              secondarySectionFront: this.secondarySectionFront.value,
            },
          },
          locals: window.kiln.locals,
        });

        this.$store.dispatch("showSnackbar", {
          message: "Article Imported",
          duration: 5000,
          position: "left",
          queueSnackbars: true,
          transition: "fade",
        });
      } catch (err) {
         this.$store.dispatch("showSnackbar", {
          message: "Failed Importing Article",
          duration: 5000,
          position: "left",
          queueSnackbars: true,
          transition: "fade",
        });
        return [];
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>
