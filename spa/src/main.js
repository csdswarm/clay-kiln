import $ from 'jquery'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

$(function () {
  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#vue-app-mount-point')
})
