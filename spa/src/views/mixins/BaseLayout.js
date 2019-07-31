/**
 *
 * Base Layout component functionality to be applied to all Layouts.
 *
 */

import VueTranspiler from '@/lib/VueTranspiler'
import * as mutationTypes from '../../vuex/mutationTypes'
import SpaPlayerInterface from '../../lib/SpaPlayerInterface'
import SpaUserInterface from '../../lib/SpaUserInterface'
import SpaStateInterface from '../../lib/SpaStateInterface'
import { addEventListeners } from '../../../../app/services/universal/spaLink'
const vueTranspiler = new VueTranspiler()

export default {
  mounted () {
    this.onLayoutUpdate()
  },
  updated () {
    if (this.isNewPage()) {
      this.onLayoutUpdate()
    }
  },
  beforeUpdate () {
    if (this.isNewPage()) {
      this.onLayoutDestroy()
    }
  },
  beforeDestroy () {
    this.onLayoutDestroy()
  },
  methods: {
    componentList: function (stateSliceKey) {
      // Return early if data not set.
      if (!this.$store.state.spaPayload[stateSliceKey]) {
        return ''
      }

      // The handlebars wrapper template will basically just load the component-list partial and pass in the appropriate property/key on this.spaPayload.
      const handlebarsWrapper = this.$store.state.handlebars.compile(`{{> component-list ${stateSliceKey} }}`)

      // Pass entire payload to wrapper template, template will pull correct data off it via stateSliceKey.
      const handlebarsHtml = handlebarsWrapper(this.$store.state.spaPayload)

      // Transpile handlebars HTML to Vue templating HTML
      return vueTranspiler.transpile(handlebarsHtml, this.$store.state.spaPayloadLocals)
    },
    /**
     * determines if there has been a page change
     *
     * @return {boolean}
     */
    isNewPage: function () {
      // if it is the initial load and there is no url yet, or any new page load
      if (!this.$store.state.spaPayload.url || this.lastUrl !== this.$store.state.spaPayload.url) {
        if (!this.$store.state.spaPayload.url) {
          this.$store.state.spaPayload.url = `${window.location.origin}${window.location.pathname}`
        }
        this.lastUrl = this.$store.state.spaPayload.url

        return true
      }
      return false
    },
    /**
     * Handle any logic required to get a new vue render to function properly
     */
    onLayoutUpdate: function () {
      if (this.$store.state.setupRan) {
        // Don't call setup as it's already been run in another call
        return
      } else {
        this.$store.commit(mutationTypes.FLAG_SETUP_RAN, true)
      }

      // Attach vue router listener on SPA links.
      addEventListeners(this.$el)

      // Create Spa/Client interfaces
      this.interfaces = {
        player: new SpaPlayerInterface(this),
        user: new SpaUserInterface(this),
        state: new SpaStateInterface(this)
      }

      this.handleComponents('mount')
    },
    /**
     * Handle any logic required to get a new vue render to function properly
     */
    onLayoutDestroy: function () {
      this.$store.commit(mutationTypes.FLAG_SETUP_RAN, false)

      // Loop over all components that were loaded and try to call any cleanup JS they have
      this.handleComponents('dismount')
    },
    /**
     * Handle setup / cleanup of components and their required JS
     *
     * @param el
     * @param type
     */
    handleComponents: function (type) {
      // Call global mount event
      let event = new CustomEvent(type)
      document.dispatchEvent(event)

      let setupComponents = []
      // Loop over all components that were loaded and try to call any setup JS they have
      this.$el.querySelectorAll('.component').forEach(component => {
        let componentName = component.getAttribute('class').match(/component--([^\s]+)/)[1] || ''
        if (componentName && !setupComponents.includes(componentName)) {
          let event = new CustomEvent(`${componentName}-${type}`)
          document.dispatchEvent(event)
          setupComponents.push(componentName)
        }
      })
    }
  }
}
