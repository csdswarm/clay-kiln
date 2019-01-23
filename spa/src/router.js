import Vue from 'vue'
import Router from 'vue-router'
import LayoutRouter from './LayoutRouter'
import SpaScroll from './lib/SpaScroll'

Vue.use(Router)

// NOTE: All routing logic is handled in LayoutRouter component method this.layoutRouter() instead of router.js
// in order to support more advanced routing and a single entry point for navigation logic (including data fetching etc).
export default new Router({
  mode: 'history',
  routes: [
    {
      path: '*',
      name: 'LayoutRouter',
      component: LayoutRouter
    }
  ],
  /**
   * Determine scrollBehavior settings on SPA navigation.
   *
   * NOTE: The Vue Router "scrollBehavior" setting does not fire on initial pageload, only on
   * SPA navigation. We handle #link-to-anchor-text links on initial
   * pageload in the App.vue mount lifecycle method.
   */
  scrollBehavior (to, from, savedPosition) {
    return SpaScroll.getSpaNavigationScrollBehavior(to, from, savedPosition)
  }
})
