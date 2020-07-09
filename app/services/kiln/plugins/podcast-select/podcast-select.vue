<!-- Podcast Select-->
<docs>
    # Podcast Select
</docs>
<template>
    <div class="podcast-select">
        <div class="ui-textbox__input">
            <ui-textbox
                    v-model="filter"
                    :placeholder="'Search for a podcast'"
                    @input="populatePodcasts"
            />
        </div>
        <div v-if="podcastOptions && podcastOptions.length">
            <ui-select
                    :search="true"
                    :options="podcastOptions"
                    :storeRawData="true"
                    :value="value"
                    @input="updateSelectedPodcast"
                    @keydown-enter="closeFormOnEnter"
            >
            </ui-select>
        </div>

        <div v-if="selectedPodcast" class="podcast-preview">
            <img class="podcast-preview__image" :src="selectedPodcast.imageUrl" />
            <a class="podcast-preview__link" :href="selectedPodcast.url">{{ selectedPodcast.title }}</a>
            <div v-if="showCategoryLabel" class="podcast-preview__category-label podcast-category-label">
              <h4 class="podcast-category-label__label">Category label</h4>
              <div class="podcast-category-label__value">{{ categoryLabelValue }}</div>

              <ui-checkbox
                v-model="shouldOverrideCategoryLabel"
                class="podcast-category-label__should-override"
                color="accent"
                label="Override the default category label?"
              />

              <ui-textbox
                v-if="shouldOverrideCategoryLabel"
                class="podcast-category-label__custom-text"
                floating-label
                label="Custom category label"
                :invalid="isCategoryLabelInvalid"
                v-model="customCategoryLabel"
                @keydown-enter="closeFormOnEnter"
              />

              <div v-if="shouldOverrideCategoryLabel && isCategoryLabelInvalid"
                class="podcast-category-label__error-message"
              >{{ CategoryLabelErrorMessage }}
              </div>
            </div>
            <div v-if="showDescription" class="podcast-preview__description podcast-description">
              <h4 class="podcast-description__label">Description</h4>
              <div class="podcast-description__value">{{ descriptionValue }}</div>

              <ui-checkbox
                v-model="shouldOverrideDescription"
                class="podcast-description__should-override"
                color="accent"
                label="Override the default description?"
              />

              <ui-textbox
                v-if="shouldOverrideDescription"
                class="podcast-description__custom-text"
                floating-label
                label="Custom description"
                :invalid="isDescriptionInvalid"
                v-model="customDescription"
                @keydown-enter="closeFormOnEnter"
              />

              <div v-if="shouldOverrideDescription && isDescriptionInvalid"
                class="podcast-description__error-message"
              >{{ descriptionErrorMessage }}
              </div>
            </div>
        </div>
    </div>
</template>
<script>
    const _get = require("lodash/get");
    const podcastUtils = require('../../../../services/universal/podcast');
    const radioApi = require('../../../client/radioApi');
    const { UiSelect, UiTextbox, UiCheckbox } = window.kiln.utils.components;

    export default {
        props: ['name', 'data', 'schema', 'args'],
        data() {
            return {
                cachedResults: {},
                filter: '',
                selectedPodcast: this.data,
                podcastOptions: null,
                showDescription: this.args.showDescription,
                showCategoryLabel: this.args.showCategoryLabel
            };
        },
        mounted () {
            this.populatePodcasts(false)
        },
        computed: {
            value() {
                return this.selectedPodcast ?  this.selectedPodcast : { label: 'Select a podcast...'  }
            },
            shouldOverrideDescription: {
              get() {
                return this.selectedPodcast.shouldOverrideDescription;
              },
              set(value) {
                this.selectedPodcast.shouldOverrideDescription = value;
              }
            },
            customDescription: {
              get() {
                return _get(this, "selectedPodcast.customDescription", '');
              },
              set(value) {
                this.selectedPodcast.customDescription = value;
              }
            },
            descriptionValue() {
              return this.shouldOverrideDescription
                ? this.customDescription
                : this.selectedPodcast.description;
            },
            isDescriptionInvalid() {
              return _get(this.customDescription, "length") < 3;
            },
            descriptionErrorMessage() {
              return this.isDescriptionInvalid ? "A value is required" : "";
            },
            shouldOverrideCategoryLabel: {
              get() {
                return this.selectedPodcast.shouldOverrideCategoryLabel;
              },
              set(value) {
                this.selectedPodcast.shouldOverrideCategoryLabel = value;
              }
            },
            customCategoryLabel: {
              get() {
                return _get(this, "selectedPodcast.customCategoryLabel", '');
              },
              set(value) {
                this.selectedPodcast.customCategoryLabel = value;
              }
            },
            categoryLabelValue() {
              return this.shouldOverrideCategoryLabel
                ? this.customCategoryLabel
                : this.selectedPodcast.category.name;
            },
            isCategoryLabelInvalid() {
              return _get(this.customCategoryLabel, "length") < 3;
            },
            CategoryLabelErrorMessage() {
              return this.isCategoryInvalid ? "A value is required" : "";
            }
        },
        methods: {
            /**
             *  This function is both called when the component is mounted and when the "Search for a podcast" filter is modified.
             *  It queries the api.radio.com for podcasts matching that API and sets them as selectable.
             *  @param {boolean} reselect - Whether this invocation should undo any current podcast selection
             */
            populatePodcasts(reselect = true) {
                if (reselect) {
                    this.selectedPodcast = null;
                }
                const self = this;
                if (self.cachedResults[self.filter]) {
                    self.podcastOptions = self.cachedResults[self.filter];
                }
                const url = self.filter && self.filter.length
                    ? `https://api.radio.com/v1/podcasts?q=${encodeURIComponent(self.filter)}`
                    : 'https://api.radio.com/v1/podcasts';

                radioApi.get(url)
                    .then( async podcastResponse => {
                        const podcasts = podcastResponse.data,
                          stationsById = await podcastUtils.getStationsForPodcasts(podcasts, window.kiln.locals);
                          
                        self.podcastOptions = podcasts.map((podcast) => {

                          const {attributes, id} = podcast; 
                          return {
                              id,
                              label: attributes.title,
                              title: attributes.title,
                              url: podcastUtils.createUrl(podcast, stationsById[podcastUtils.getStationIdForPodcast(podcast)]),
                              imageUrl: podcastUtils.createImageUrl(attributes.image),
                              description: attributes.description,
                              shouldOverrideDescription: attributes.shouldOverrideDescription || false,
                              customDescription: attributes.customDescription || '',
                              shouldOverrideCategoryLabel: attributes.shouldOverrideCategoryLabel || false,
                              customCategoryLabel: attributes.customCategoryLabel || '',
                              category: _get(attributes, 'category[0]')
                          }
                        });
                        self.cachedResults[self.filter] = self.podcastOptions
                    })
                    .catch(e => {
                    })
            },

            /**
             *  This function is called when a podcast is selected from the dropdown. Sets it as currently selected.
             */
            updateSelectedPodcast(input) {
                this.selectedPodcast = input;
                this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.selectedPodcast })
            },
        },
        components: {
            UiTextbox,
            UiSelect,
            UiCheckbox
        }
    }
</script>
