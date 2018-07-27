import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

// Wait 2 seconds to mount vue because otherwise window.kiln.componentTemplates won't be set yet (race condition bug).
setTimeout(() => {
  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#vue-app-mount-point')
}, 2000)
