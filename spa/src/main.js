import $ from 'jquery'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store, { setVuexStoreBaseState } from './store'

Vue.config.productionTip = false

/**
 *
 * Set base state of Vuex store to SSR delivered window.spaPayload
 * before instantiating SPA.
 *
 */
setVuexStoreBaseState(store)

$(function () {
  const instantiateSpa = () => {
    window.vueApp = new Vue({
      router,
      store,
      render: h => h(App)
    }).$mount('#vue-app-mount-point')
  }

  /**
   *
   * Vue must instantiate with slight delay in development/staging environments
   * in order for the Vue dev tools to work as expected.
   *
   * https://github.com/vuejs/vue-devtools/issues/408#issuecomment-349297890
   *
   * Note: Webpack replaces the string "process.env.NODE_ENV" with "production"
   * or "development" during build depending on "mode".
   *
   * https://webpack.js.org/concepts/mode/#usage
   *
   */
  if (process.env.NODE_ENV !== 'production') {
    setTimeout(instantiateSpa, 500)
  } else {
    instantiateSpa()
  }
})
