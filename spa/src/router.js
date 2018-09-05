import Vue from 'vue'
import Router from 'vue-router'
import LayoutRouter from './LayoutRouter'

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
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return {
        selector: to.hash
      }
    } else {
      return {
        x: 0,
        y: 0
      }
    }
  }
})
