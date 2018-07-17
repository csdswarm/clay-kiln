import Vue from 'vue'
import Router from 'vue-router'
import Radio from './views/Radio.vue'
import About from './views/About.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'radio',
      component: Radio
    },
    {
      path: '/about',
      name: 'about',
      component: About
    }
  ]
})
