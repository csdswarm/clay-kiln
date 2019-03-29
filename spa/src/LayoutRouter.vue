<template>
  <div>
    <component v-bind:is="this.activeLayoutComponent"></component>
    <modal
      name="account-modal"
      @closed="modalClosed"
      :adaptive="true"
      :scrollable="true"
      width="400px"
      height="auto"
      :min-height="300"
    >
      <account/>
    </modal>
  </div>
</template>

<script>

// Import dependencies.
import axios from 'axios'
import * as mutationTypes from '@/vuex/mutationTypes'
import OneColumnLayout from '@/views/OneColumnLayout'
import OneColumnFullWidthLayout from '@/views/OneColumnFullWidthLayout'
import TwoColumnLayout from '@/views/TwoColumnLayout'
import MetaManager from '@/lib/MetaManager'
import QueryPayload from '@/lib/QueryPayload'
import Account from '@/views/Account'
import accountRoutes from '@/views/account/routes/'
import { mapState } from 'vuex'

// Instantiate libraries.
const metaManager = new MetaManager()
const queryPayload = new QueryPayload()

export default {
  name: 'LayoutRouter',
  created () {
    // Load initial layout.
    this.activeLayoutComponent = this.layoutRouter(this.$store.state.spaPayload)
  },
  data: function () {
    return {
      activeLayoutComponent: null,
      redirectTo: null
    }
  },
  computed: {
    ...mapState([
      'accountComponent'
    ])
  },
  methods: {
    /**
     *
     * Contains Layout template matching logic.
     *
     * Match a given spa payload with a Vue layout component
     *
     * @param {object} spaPayload - The handlebars context payload data.
     * @returns {string} - Matched Layout component name.
     */
    layoutRouter (spaPayload) {
      let nextLayoutComponent = null

      // Match to correct layout template by querying for existence of "tertiary" property on spa payload object.

      if (spaPayload.tertiary) {
        nextLayoutComponent = 'TwoColumnLayout'
      } else if (!spaPayload.secondary) {
        nextLayoutComponent = 'OneColumnFullWidthLayout'
      } else {
        nextLayoutComponent = 'OneColumnLayout'
      }

      return nextLayoutComponent
    },
    /**
     * converts a string into a regular expression * as a wildcard
     *
     * @param {string} url
     * @returns {RegExp}
     */
    createRegExp: (url) => {
      let regExp = url.replace(/\*/g, '.*')

      return new RegExp(`^${regExp}`, 'i')
    },
    /**
     * shows the account the modal
     *
     */
    modalShow () { this.$modal.show('account-modal') },
    /**
     * hides the account modal
     *
     */
    modalHide () { this.$modal.hide('account-modal') },
    /**
     * keep state in sync
     *
     */
    modalClosed () {
      this.$store.commit(mutationTypes.ACCOUNT_MODAL_HIDE)
    },
    /**
     * if the path belongs to an account page, show modal and handle routing else hide the modal
     *
     * @param {string} to
     * @param {string} from
     * @returns {boolean}
     */
    accountRouteHandled (to, from) {
      if (/^\/account\//.test(to)) {
        const route = accountRoutes.find((route) => route.path === to)

        if (route) {
          this.modalShow()

          this.$store.commit(mutationTypes.ACCOUNT_MODAL_SHOW, route.component)

          // set the current title and path for where to update history to when the modal changes
          if (!this.redirectTo && from) {
            this.redirectTo = {
              url: from,
              title: document.title
            }
          }

          return true
        }
      }
      this.modalHide()

      return false
    },
    /**
     * determines if the url belongs to the spa
     *
     * @param {string} url
     * @returns {boolean}
     */
    isLocalUrl: (url) => !/^https?:\/\//.test(url) || this.createRegExp(`${window.location.protocol}//${window.location.hostname}`).test(url),
    /**
     *
     * Returns an object with all the JSON payload required for a page render.
     *
     * @param {string} destination - The URL being requested.
     * @param {object} query - The query object
     * @returns {object}  - The JSON payload
     */
    getNextSpaPayload: async function getNextSpaPayload (destination, query) {
      const queryString = query.length !== 0 ? Object.keys(query).map((key) => key + '=' + query[key]).join('&') : ''
      const newSpaPayloadPath = `${destination}?json${queryString ? `&${queryString}` : ''}`
      const newSpaPayloadPathNoJson = `${destination}${queryString ? `?${queryString}` : ''}`

      try {
        const nextSpaPayloadResult = await axios.get(newSpaPayloadPath, {
          headers: {
            'x-amphora-page-json': true
          }
        })

        nextSpaPayloadResult.data.locals = this.$store.state.spaPayloadLocals
        nextSpaPayloadResult.data.url = `${window.location.protocol}${newSpaPayloadPathNoJson}`
        return nextSpaPayloadResult.data
      } catch (e) {
        if (e.response.status === 301 && e.response.data.redirect) {
          const separator = e.response.data.redirect.indexOf('?') === -1 ? '?' : '&'
          const redirect = `${e.response.data.redirect}${queryString ? `${separator}${queryString}` : ''}`
          if (this.isLocalUrl(redirect)) {
            // we are returning the new path, so need to adjust the browser path
            window.history.replaceState({ }, null, redirect)
            return this.getNextSpaPayload(redirect.replace(/^[^/]+/i, ''), query)
          } else {
            window.location.replace(redirect)
            return null
          }
        } else {
          const nextSpaPayloadResult = await axios.get(`//${window.location.hostname}/_pages/404.json`)
          nextSpaPayloadResult.data.locals = this.$store.state.spaPayloadLocals
          nextSpaPayloadResult.data.url = `${window.location.protocol}${newSpaPayloadPathNoJson}`
          return nextSpaPayloadResult.data
        }
      }
    },
    /**
     *
     * Returns an object with all the payload data expected by client.js consumers of the SPA "pageView" event.
     *
     * @param {string} path - The path of the next route.
     * @param {object} spaPayload - The handlebars context payload data associated with the "next" page.
     */
    buildPageViewEventData: function buildPageViewEventData (path, spaPayload) {
      const nextTitleComponentData = queryPayload.findComponent(spaPayload.head, 'meta-title')
      const nextMetaDescriptionData = queryPayload.findComponent(spaPayload.head, 'meta-description')
      const nextMetaImageData = queryPayload.findComponent(spaPayload.head, 'meta-image')
      const nextArticleData = queryPayload.findComponent(spaPayload.main, 'article')
      const nextGalleryData = queryPayload.findComponent(spaPayload.main, 'gallery')
      const nextHomepageData = queryPayload.findComponent(spaPayload.main, 'homepage')
      const nextSectionFrontPageData = queryPayload.findComponent(spaPayload.main, 'section-front')
      const nextTopicPageData = queryPayload.findComponent(spaPayload.pageHeader, 'topic-page-header')
      const nextStationDetailPageData = queryPayload.findComponent(spaPayload.main, 'station-detail')

      return {
        toTitle: (nextTitleComponentData && nextTitleComponentData.title) ? nextTitleComponentData.title : '',
        toDescription: (nextMetaDescriptionData && nextMetaDescriptionData.description) ? nextMetaDescriptionData.description : '',
        toMetaImageUrl: (nextMetaImageData && nextMetaImageData.imageUrl) ? nextMetaImageData.imageUrl : '',
        toPath: path,
        toArticlePage: nextArticleData || {},
        toGalleryPage: nextGalleryData || {},
        toHomepage: nextHomepageData || {},
        toSectionFrontPage: nextSectionFrontPageData || {},
        toTopicPage: nextTopicPageData || {},
        toStationDetailPage: nextStationDetailPageData || {}
      }
    }
  },
  components: {
    OneColumnLayout,
    OneColumnFullWidthLayout,
    TwoColumnLayout,
    Account
  },
  watch: {
    '$route': async function (to, from) {
      if (!this.accountRouteHandled(to.path, from.path)) {
        // Start loading animation.
        this.$store.commit(mutationTypes.ACTIVATE_LOADING_ANIMATION, true)

        // Get SPA payload data for next path.
        const spaPayload = await this.getNextSpaPayload(`//${window.location.hostname}${to.path}`, to.query)

        if (spaPayload) {
          const path = (new URL(spaPayload.url)).pathname

          // Load matched Layout Component.
          this.activeLayoutComponent = this.layoutRouter(spaPayload)

          // Reset/flush the pageCache
          this.$store.commit(mutationTypes.RESET_PAGE_CACHE)

          // Commit next payload to store to kick off re-render.
          this.$store.commit(mutationTypes.LOAD_SPA_PAYLOAD, spaPayload)

          // Update Meta Tags and other appropriate sections of the page that sit outside of the SPA
          metaManager.updateExternalTags(this.$store.state.spaPayload)

          // Stop loading animation.
          this.$store.commit(mutationTypes.ACTIVATE_LOADING_ANIMATION, false)

          // Build pageView event data
          const pageViewEventData = this.buildPageViewEventData(path, this.$store.state.spaPayload)

          // Call global pageView event.
          const event = new CustomEvent(`pageView`, {
            detail: pageViewEventData
          })

          document.dispatchEvent(event)
        }
      }
    },
    accountComponent (component) {
      if (!component) {
        // no component, ensure that the modal is hidden
        this.modalHide()

        if (this.redirectTo) {
          // the modal has closed but if re just push to the next route in Vue, it forces a refresh of the components
          // on the page, there is discussion https://github.com/vuejs/vue-router/issues/703 with a proposed workaround
          // but to keep rework to a minimum, we can update the browser history to add the last route from the modal
          // then also tap into the router history to change what it thinks the current page is so routing will work
          // correctly in Vue

          // update browser history
          window.history.pushState({}, null, window.location.pathname)
          // add the title back to the page we never left before the modal
          document.title = this.redirectTo.title
          // now replace the new history with our old page and title
          window.history.replaceState({ }, null, this.redirectTo.url)
          // update vue history also
          this.$router.history.current = { ...this.$router.history.current, path: this.redirectTo.url }
          // reset our redirect
          this.redirectTo = null
        }
      } else {
        // since the modal is not updating the title, manually do it
        // if we need to update anything for meta data or additional tracking, it can be done here
        document.title = `${component.name.replace(/([A-Z])/g, ' $1')} | RADIO.COM`
      }
    }
  },
  mounted () {
    this.accountRouteHandled(this.$route.path, '/')
  }
}

</script>

// use a global bus for listening to events for closing the modal
// use the global bus for emiting the event from inside the login.vue page
