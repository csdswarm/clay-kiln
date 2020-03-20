<!-- Content Import Content -->
<template>
    <div class="content-import">
        <div class="content-import__input">
            <ui-textbox
                    floating-label
                    label="Import Content (Paste Full Url)"
                    class="content-import__input-textbox"

                    @keydown-enter="importContent"
                    v-model="contentUrl"
            ></ui-textbox>
            <ui-icon-button icon="check" @click="importContent" tooltip="Import" tooltipPosition="top center"></ui-icon-button>
        </div>
        <div v-if="errorUrl" class="content-import__error">
            <a :href="errorUrl" target="_blank" class="content-import__error">{{ error }}</a>
        </div>
        <div v-else-if="error" class="content-import__error">
            {{ error }}
        </div>
        <ui-progress-circular v-show="loading" :size="54"></ui-progress-circular>
    </div>
</template>

<script>
  import rest from '../../../universal/rest';
  import urlParse from 'url-parse';
  import queryService, { onePublishedArticleByUrl } from '../../../client/query';
  import { mapGetters } from 'vuex'
  import { DEFAULT_STATION } from '../../../universal/constants';
  import { ensureStartsWith } from '../../../universal/utils'

  const UiIconButton = window.kiln.utils.components.UiIconButton;
  const UiProgressCircular = window.kiln.utils.components.UiProgressCircular;
  const UiTextbox = window.kiln.utils.components.UiTextbox;
  const location = `${ window.location.protocol }//${window.location.hostname }`;

  export default {
    data() {
      return {
        contentUrl: '',
        error: '',
        errorUrl: '',
        loading: false,
        stations: window.kiln.locals.stationsICanImportContent
      }
    },
    computed: {
      selectedStation() {
        return window.kiln.locals.stationsIHaveAccessTo[DEFAULT_STATION.site_slug];
      }
    },
    methods: {
      /**
       * search for an existing url and return one if found
       *
       * @param {string} path
       *
       * @returns {string}
       */
      async findExisting(path) {
        const { locals } = window.kiln,
          { host } = locals.site,
          query = onePublishedArticleByUrl(`http://${host}${path}`, ['canonicalUrl'], window.kiln.locals),
          results = await queryService.searchByQuery(
            query,
            locals,
            { shouldDedupeContent: false }
          ),
          { canonicalUrl } = results[0] || {};

        return canonicalUrl
      },
      /**
       * parses domain and slug from url and sends to import content lambda
       */
      async importContent() {
        this.error = '';
        this.errorUrl = '';
        this.loading = true;
        const includesProtocol = this.contentUrl.startsWith('http');
        // ensure a protocol and remove trailing slashes from url
        const url =  `${ includesProtocol ? '' : 'https://' }${ this.contentUrl.replace(/\/$/, '') }`;
        const { host, pathname } = urlParse(url, {});
        const contentPath = ensureStartsWith('/', this.selectedStation.slug + pathname);

        try {
          //see if the item already exists
          const existing = await this.findExisting(contentPath);

          if (existing) {
            this.loading = false;
            this.error = 'This content already exists.';
            this.errorUrl = existing;
          } else {
            const [result] = await rest.post('/import-content', {
              stationSlug: this.selectedStation.slug,
              domain: host,
              filter: { slug: pathname }
            });

            if (result && result.success) {
              window.location.href = `${ location }${ result.url }?edit=true`;
            } else {
              this.loading = false;
              this.error = `This content failed to import.  Please log an error ticket with the error "${ result.message }"`;
            }
          }
        } catch (e) {
          this.loading = false;
          this.error = `An unexpected error has occurred. ${e}`;
        }
      }
    },
    components: {
      UiIconButton,
      UiProgressCircular,
      UiTextbox
    }
  }
</script>

