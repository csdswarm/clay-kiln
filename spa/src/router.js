import Vue from 'vue'
import Router from 'vue-router'
import OneColumnLayout from './views/OneColumnLayout'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'OneColumnLayout',
      component: OneColumnLayout
    }
  ]
})
