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
      <a :href="selectedPodcast.url">{{ selectedPodcast.title }}</a>
      <img class="podcast-preview" :src="selectedPodcast.imageUrl" />
    </div>

    <br /><!-- remove me after styling -->
  </div>
</template>
 <script>
 import _ from 'lodash'
 const UiSelect = window.kiln.utils.components.UiSelect
 const UiTextbox = window.kiln.utils.components.UiTextbox
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
    populatePodcasts(reselect = true) {
      if (reselect) {
        this.selectedPodcast = null;
      }
      const self = this;
      if (self.cachedResults[self.filter]) {
        self.podcastOptions = self.cachedResults[self.filter]
      }
      const url = self.filter && self.filter.length
        ? `http://api.radio.com/v1/podcasts?q=${encodeURIComponent(self.filter)}`
        : 'http://api.radio.com/v1/podcasts'

      fetch(url)
        .then(response => {
          return response.json()
        })
        .then(podcastResponse => {
          self.podcastOptions = podcastResponse.data.map((podcast) => {
            // remove common words and special characters
            // test here: https://gist.github.com/sbryant31/b316df0a9e7d9446b8871ca688405a15
            const processedTitle = podcast.attributes.title
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9-\ ]+/g, "")
              .replace(/\b(\a|an|as|at|before|but|by|for|from|is|in|into|like|of|off|on|onto|per|since|than|the|this|that|to|up|via|with)\b\ /gi, '')
              .replace(/\ +/g, '-')
              .replace(/-+/g, '-')

            const url = `https://radio.com/media/podcast/${processedTitle}`
            return {
              label: podcast.attributes.title,
              title: podcast.attributes.title,
              url,
              imageUrl: podcast.attributes.image,
            }
          })
          self.cachedResults[self.filter] = self.podcastOptions
        })
        .catch(e => {
        })
    },

    updateSelectedPodcast(input) {
      this.selectedPodcast = input;
      console.log('path', this.name, 'data', this.selectedPodcast)
      this.$store.commit('UPDATE_FORMDATA', { path: this.name, data: this.selectedPodcast })
     },
  },
  components: {
    UiSelect,
    UiTextbox
  }
}
</script>
 <style>
 </style>

