/**
 *
 * SpaScroll lib contains logic related to SPA scrolling
 *
 *  - Anchor text scrolling (example: #hash-link-urls)
 *  - "Saved position" scrolling (example: when you press back button in browser, browser
 *    places user on same position they were at when they left previous page)
 *  - Dynamic slug when scrolling through Gallery slides.
 *
 */

import debounce from 'lodash/debounce'
import $ from 'jquery'
import * as mutationTypes from '../vuex/mutationTypes'

const SpaScroll = {
  /**
   *
   * This logic allows the SPA to support deep linking on initial pageload
   * to anchor text within a page via a #hash-link in the url.
   *
   * Vue-router does not handle this out of the box (at this time).
   *
   * This logic was derived by taking vue-router's scroll logic that applies
   * on SPA navigate, and modifying it to work on initial page load.
   *
   * Inspiration: https://github.com/vuejs/vue-router/blob/7f9ed306e99674afe4571c313dec5743453b3192/dist/vue-router.common.js#L1594-L1644
   *
   * @param {string} routeHash - The route hash.
   */
  initialPageloadHashLinkScroll: function initialPageloadHashLinkScroll (routeHash) {
    function getElementPosition (el, offset) {
      var docEl = document.documentElement
      var docRect = docEl.getBoundingClientRect()
      var elRect = el.getBoundingClientRect()
      return {
        x: elRect.left - docRect.left - offset.x,
        y: elRect.top - docRect.top - offset.y
      }
    }

    function scrollToPosition (hash) {
      let el = null

      try {
        el = document.querySelector(hash)
      } catch (e) {
        // invalid hash for querySelector
      }
      if (el) {
        const offset = { x: 0, y: 0 }
        const position = getElementPosition(el, offset)
        window.scrollTo(position.x, position.y)
      }
    }

    scrollToPosition(routeHash)
  },
  /**
   *
   * Determine scrollBehavior settings on SPA navigation:
   *
   * In order for the Vue router scroll behavior to work correctly with the
   * rest of our client side JS code that is constantly updating the DOM on
   * SPA navigation, we need to put a slight delay on the behavior.
   *
   * As such current logic is to scroll to top of page immediately on standard
   * SPA navigation, but if there is a need to scroll into the page on SPA navigation
   * (ie savedPosition or #link-to-anchor-text) we will wait 500ms before
   * kicking off the scroll logic.
   *
   * NOTE: The Vue Router "scrollBehavior" setting does not fire on initial pageload, only on
   * SPA navigation. We handle #link-to-anchor-text links on initial
   * pageload in the App.vue mount lifecycle method.
   *
   * @param {object} to - The vue-router scrollBehavior "to" object aka "next" this.$route.
   * @param {object} from - The vue-router scrollBehavior "from" object aka "previous" this.$route.
   * @param {object} savedPosition - The vue-router scrollBehavior "savedPosition" object.
   */
  getSpaNavigationScrollBehavior: function getSpaNavigationScrollBehavior (to, from, savedPosition) {
    // Non-standard Scroll into page logic requires 500ms delay.
    if (to.hash || savedPosition) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Prioritize hash link positions over savedPosition.
          if (to.hash) {
            return resolve({ selector: to.hash })
          } else {
            return resolve(savedPosition)
          }
        }, 500)
      })
    } else {
      // Standard behavior is to synchronously scroll to top of page on SPA navigation.
      return {
        x: 0,
        y: 0
      }
    }
  },
  /**
   *
   * Attaches a scroll event handler that dynamically updates the
   * current SPA slug by adding a slide related direct hash link
   * (Example: #Slide-cjqy94syi000a3g5vf6cw5try-example-slide-direct-link)
   * to the slug when scrolling through a gallery.
   *
   * NOTE: The "this" context must be set to the Vue app itself when calling
   * attachGallerySlideDynamicSlug. As such make sure you call it like:
   *
   * attachGallerySlideDynamicSlug.call(this)
   *
   * Where this refers to the Vue app.
   *
   */
  attachGallerySlideDynamicSlug: function attachGallerySlideDynamicSlug () {
    // Create gallery slide dynamic slug update handler.
    // Debounce handler for performance since it will be attached to scroll event.
    const slideScrollHandler = debounce(() => {
      const slideNodeList = this.$el.querySelectorAll('.component--gallery-slide')

      // If no gallery slides found, short circuit handler for performance.
      if (!slideNodeList.length) {
        return
      }

      // Calculate topBuffer (Because of floating nav we need to buffer a bit from the actual top of the window)
      const topBuffer = calculateTopBuffer(this.$el)

      // Attempt to match a gallery slide
      const matchedSlide = getMatchedSlide(slideNodeList, topBuffer)

      // If slide is matched, update the url hash to point to the slide appropriately, and potentially fire slide pageview event.
      // If no slide matched, reset url to original url for this Gallery SPA route.
      if (matchedSlide) {
        processMatchedSlide.call(this, matchedSlide)
      } else {
        history.replaceState(null, null, this.$route.path)
      }
    }, 300)

    // Attach the handler to scroll event.
    window.addEventListener('scroll', slideScrollHandler)
  }
}

/**
 *
 * Update the browser slug to link directly to this matched slide and also
 * fire slide pageview if not already fired on this unique Gallery view.
 *
 * processMatchedSlide must be executed via processMatchedSlide.call(vue) with the
 * Vue app passed in as first parameter. The context of "this" in this function
 * must be set to the vue app.
 *
 * @param {object} matchedSlide - matched slide DOM element.
 */
function processMatchedSlide (matchedSlide) {
  // Update slug to link directly to slide
  history.replaceState(null, null, `#${matchedSlide.id}`)

  // If we haven't already for this unique Gallery view... fire slide pageview event to Client.js listener.
  if (!this.$store.state.pageCache.gallerySlidePageviews[matchedSlide.id]) {
    // Track slide pageview in Vuex.
    this.$store.commit(mutationTypes.TRACK_GALLERY_SLIDE_PAGEVIEW, matchedSlide.id)
  }
}

/**
 *
 * Helper function to calculate the buffer/padding we need from the top
 * of the screen because of the floating navigation bar.
 *
 * @param {object} el - DOM element.
 */
function calculateTopBuffer (el) {
  let topBuffer = 0
  const navBar = el.querySelector('.radiocom-nav')
  const navBarRect = navBar.getBoundingClientRect()
  const navBarStyle = getComputedStyle(navBar)

  if (navBarRect && navBarStyle && navBarStyle.position === 'fixed') {
    topBuffer = navBarRect.height
  }

  topBuffer = topBuffer + 50 // Pad it a bit more than just the height of the floating navbar.

  return topBuffer
}

/**
 *
 * Attempt to match a slide to be used to update dynamic slug.
 *
 * @param {NodeList} slideNodeList - NodeList of slide dom elements. See: https://developer.mozilla.org/en-US/docs/Web/API/NodeList.
 * @param {number} topBuffer - Number of pixels to pad/buff matching logic from top of screen.
 */
function getMatchedSlide (slideNodeList, topBuffer) {
  let matchedSlide = null
  for (let i = 0; i < slideNodeList.length; i++) {
    const slide = slideNodeList[i]
    const slideRect = slide.getBoundingClientRect()
    const slideHeight = $(slide).outerHeight(true)
    const slideTopOffset = slideRect.top
    const slideBottomOffset = slideRect.top + slideHeight

    if (slideTopOffset - topBuffer <= 0 && slideBottomOffset - topBuffer > 0) {
      matchedSlide = slide
      break
    }
  }

  return matchedSlide
}

export default SpaScroll
