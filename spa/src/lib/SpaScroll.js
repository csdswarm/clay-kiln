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

import debounce from 'lodash.debounce'

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
      const el = document.querySelector(hash)
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
            return resolve({selector: to.hash})
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

      // If slide is in viewport currently, match it.
      // NodeLists are not JS arrays, so we will have to write a custom for loop that emulates .find() for performance.
      // https://developer.mozilla.org/en-US/docs/Web/API/NodeList
      let matchedSlide = null
      for (let i = 0; i < slideNodeList.length; i++) {
        if (isElementInViewport(slideNodeList[i])) {
          matchedSlide = slideNodeList[i]
          break
        }
      }

      // If slide is matched, update the url hash to point to the slide appropriately.
      // If no slide matched, reset url to original url for this SPA route.
      if (matchedSlide) {
        history.replaceState(null, null, `#${matchedSlide.id}`)
      } else {
        history.replaceState(null, null, this.$route.fullPath)
      }
    }, 300)

    // Attach the handler to scroll event.
    window.addEventListener('scroll', slideScrollHandler)
  }
}

/**
 *
 * Helper function to determine if a DOM element is in the viewport.
 *
 * Logic inspired by: https://stackoverflow.com/a/7557433
 *
 * @param {object} el - DOM element.
 */
function isElementInViewport (el) {
  const rect = el.getBoundingClientRect()

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

export default SpaScroll
