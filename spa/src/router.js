import Vue from 'vue'
import Router from 'vue-router'
// import Radio from './views/Radio.vue'
// import About from './views/About.vue'
import Hybrid from './views/Hybrid.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'hybrid',
      component: Hybrid
    }
  ]
})
