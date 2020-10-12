<template>
  <div>
    <component v-bind:is="this.activeLayoutComponent"></component>
    <modal
      name="modal"
      @closed="modalClosed"
      :adaptive="true"
      :scrollable="true"
      width="400px"
      height="auto"
      :min-height="300"
    >
      <modalContent/>
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
import FaviconManager from '@/lib/FaviconManager'
import SpaScroll from '@/lib/SpaScroll'
import URL from 'url-parse'
import { getLocals } from '../../app/services/client/spaLocals'
import ModalContent from '@/views/ModalContent'
import modalRoutes from '@/views/routes/intercept'
import actionRoutes from '@/views/routes/action'
import { mapState } from 'vuex'
import * as actionTypes from './vuex/actionTypes'

const interceptRoutes = [].concat(modalRoutes, actionRoutes)

// Instantiate libraries.
const metaManager = new MetaManager()
const queryPayload = new QueryPayload()
const faviconManager = new FaviconManager()

export default {
  name: 'LayoutRouter',
  async created () {
    /* TODO - UNCOMMENT to enable radium - ALSO change how this is being done so we only call the get profile if we know if the user is logged in
    // see if the user is logged in and populate the store
    await this.$store.dispatch(actionTypes.GET_PROFILE, true)
    */
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
      'modalComponent',
      'routerPush'
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
    createRegExp (url) {
      const regExp = url.replace(/\*/g, '.*')

      return new RegExp(`^${regExp}`, 'i')
    },
    /**
     * shows the account the modal
     *
     */
    modalShow () { this.$modal.show('modal') },
    /**
     * hides the account modal
     *
     */
    modalHide () { this.$modal.hide('modal') },
    /**
     * keep state in sync
     *
     */
    modalClosed () {
      this.$store.commit(mutationTypes.ACCOUNT_MODAL_HIDE)
    },
    /**
     * returns the component that should be rendered for a modal route
     *
     *  @param {string} path
     *  @returns {boolean}
     */
    getInterceptRoute (path) {
      return interceptRoutes.find((route) => route.path === path)
    },
    /**
     * Provides metadata about routes that should invoke a modal
     * @typedef {{path: string, name: string, component: object, props: [boolean]}} ModalRoute
     */
    /**
     * Provides metadata about routes that should invoke an action
     * @typedef {{path: string, name: string, action: string, props: [boolean]}} ActionRoute
     */
    /**
     * Provides metadata for routes to be intercepted
     * @typedef {(ModalRoute|ActionRoute)} InterceptRoute
     */
    /**
     * if the path belongs to an account page, show modal and handle routing else hide the modal
     *
     * @param {InterceptRoute} [route]
     * @param {string} from
     * @returns {boolean}
     */
    handleIntercept (route, from) {
      const { component, action } = route || {}

      if (component) {
        this.modalShow()

        this.$store.commit(mutationTypes.ACCOUNT_MODAL_SHOW, component)

        // set the current path for where to update history to when the modal changes
        if (!this.redirectTo && from) {
          this.redirectTo = from
        }

        return true
      } else if (action) {
        const returnToPage = () => { this.$router.push(from) }
        this.$store
          .dispatch(action)
          .then(returnToPage)
          .catch(returnToPage)
        return true
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
    isLocalUrl (url) {
      return !/^https?:\/\//.test(url) || this.createRegExp(`${window.location.protocol}//${window.location.hostname}`).test(url)
    },
    /**
       *
       * Returns an object with all the JSON payload required for a page render.
       *
       * @param {string} destination - The URL being requested.
       * @param {object} query - The query object
       * @returns {object}  - The JSON payload
       */
    getNextSpaPayload: async function getNextSpaPayload (destination, query) {
      // remove the extension from preview pages
      const cleanDestination = destination.replace('.html', '')
      const queryString = query.length !== 0 ? Object.keys(query).map((key) => key + '=' + query[key]).join('&') : ''
      const newSpaPayloadPath = `${cleanDestination}?json${queryString ? `&${queryString}` : ''}`
      const newSpaPayloadPathNoJson = `${cleanDestination}${queryString ? `?${queryString}` : ''}`

      // Reset loaded ids to prevent breaking deduping during spa navigation
      this.$store.commit(mutationTypes.SET_LOADED_IDS, [])

      try {
        const nextSpaPayloadResult = await axios.get(newSpaPayloadPath, {
          headers: {
            // preview pages will 404 if the header is true because the published key does not exist
            'x-amphora-page-json': !destination.includes('.html'),
            'x-locals': JSON.stringify(await getLocals(this.$store.state)),
            'x-loaded-ids': '[]'
          }
        })

        this.$store.commit(
          mutationTypes.SET_LOADED_IDS,
          JSON.parse(nextSpaPayloadResult.headers['x-loaded-ids'] || '[]')
        )

        nextSpaPayloadResult.data.locals = this.$store.state.spaPayloadLocals
        nextSpaPayloadResult.data.url = `${window.location.protocol}${newSpaPayloadPathNoJson}`
        return nextSpaPayloadResult.data
      } catch (e) {
        if (e.response.status === 301 && e.response.data.redirect) {
          const separator = e.response.data.redirect.indexOf('?') === -1 ? '?' : '&'
          const redirect = `${e.response.data.redirect}${queryString ? `${separator}${queryString}` : ''}`
          if (this.isLocalUrl(redirect)) {
            // we are returning the new path, so need to adjust the browser path
            window.history.replaceState({}, null, redirect)
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
      const nextStationDirectoryPageData = queryPayload.findComponent(spaPayload.main, 'stations-directory')

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
        toStationDetailPage: nextStationDetailPageData || {},
        toStationDirectoryPage: nextStationDirectoryPageData || {}
      }
    },
    /**
     *
     *  Handles the logic for rendering the page with data from clay and updates any required DOM elements
     *
     */
    async handleSpaRoute (to) {
      // run any spa actions before getting data for a new page render
      await this.$store.dispatch(actionTypes.ROUTE_CHANGE, to)

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

        // Update favicon and Apple Touch Icons in the head since outside the Vue app mounting point
        faviconManager.updateIcons(this.$store.state.spaPayload)

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
  components: {
    OneColumnLayout,
    OneColumnFullWidthLayout,
    TwoColumnLayout,
    ModalContent
  },
  watch: {
    '$route': async function (to, from) {
      // handle internal hashes
      if (to.path === from.path && to.hash !== from.hash) {
        SpaScroll.initialPageloadHashLinkScroll(to.hash)
      } else {
        const intercept = this.getInterceptRoute(to.path)

        if (intercept) {
          if (to.path.toLocaleLowerCase() === from.path.toLocaleLowerCase()) {
            // to prevent looping go to home page
            from.path = '/'
          }
          await this.handleIntercept(intercept, from.path)
        } else {
          await this.handleSpaRoute(to)
        }
      }
    },
    routerPush (path) {
      if (path) {
        this.$router.push({ path })
        // reset routerPush so that future values set on it always trigger a change and consequently, this method
        this.$store.state.routerPush = null
      }
    },
    modalComponent (component) {
      // always clear any previous error message
      this.$store.commit(mutationTypes.MODAL_ERROR, null)

      if (!component) {
        // no component, ensure that the modal is hidden
        this.modalHide()

        if (this.redirectTo) {
          const path = this.redirectTo

          this.redirectTo = null

          this.$router.push(path)
        }
      } else {
        // since the modal is not updating the title, manually do it
        // if we need to update anything for meta data or additional tracking, it can be done here
        metaManager.updateTitleTag(`${component.name.replace(/([A-Z])/g, ' $1')} | RADIO.COM`)
      }
    }
  },
  mounted () {
    this.handleIntercept(this.getInterceptRoute(this.$route.path), '/')
  }
}
</script>

// use a global bus for listening to events for closing the modal
// use the global bus for emiting the event from inside the login.vue page
