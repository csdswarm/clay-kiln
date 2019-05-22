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
        </div>
    </div>
</template>
<script>
    const utils = require('../../../../services/universal/podcast');
    const UiSelect = window.kiln.utils.components.UiSelect;
    const UiTextbox = window.kiln.utils.components.UiTextbox;
    export default {
        props: ['name', 'data', 'schema', 'args'],
        data() {
            return {
                cachedResults: {},
                filter: '',
                selectedPodcast: this.data,
                podcastOptions: null
            };
        },
        mounted () {
            this.populatePodcasts(false)
        },
        computed: {
            value() {
                return this.selectedPodcast ?  this.selectedPodcast : { label: 'Select a podcast...'  }
            },
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

                fetch(url)
                    .then(response => {
                        return response.json();
                    })
                    .then(podcastResponse => {
                        self.podcastOptions = podcastResponse.data.map((podcast) => {
                            return {
                                label: podcast.attributes.title,
                                title: podcast.attributes.title,
                                url: utils.createUrl(podcast.attributes.title),
                                imageUrl: utils.createImageUrl(podcast.attributes.image),
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
            UiSelect,
            UiTextbox
        }
    }
</script>


