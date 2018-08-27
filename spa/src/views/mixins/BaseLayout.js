/**
 *
 * Base Layout component functionality to be applied to all Layouts.
 *
 */

import URL from 'url-parse'
import VueTranspiler from '@/lib/VueTranspiler'
const vueTranspiler = new VueTranspiler()
let setupCalled = false;

export default {
  mounted () {
    this.onLayoutUpdate()
  },
  updated() {
    this.onLayoutUpdate()
  },
  beforeDestroy () {
    // Call global dismount event
    let event = new CustomEvent(`dismount`)
    document.dispatchEvent(event)

    // Loop over all components that were loaded and try to call any cleanup JS they have
    this.handleComponents('dismount')
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
      return vueTranspiler.transpile(handlebarsHtml)
    },
    onSpaLinkClick: function (event, element) {
      event.preventDefault()

      // Remove the event listener
      element.removeEventListener('click', element.fn, false)

      const linkParts = new URL(element.getAttribute('href'))
      this.$router.push(linkParts.pathname)
    },
    onLayoutUpdate: function() {
      // Attach vue router listener on SPA links.
      this.$el.querySelectorAll('a.spa-link').forEach(link => {
        link.addEventListener('click', event => {
          this.onSpaLinkClick(event, link)
        })
      })

      // Loop over all components that were loaded and try to call any setup JS they have
      this.handleComponents('mount')
    },
    /**
     * Handle setup / cleanup of components
     *
     * @param el
     * @param type
     */
    handleComponents: function (type) {
      switch (type) {
        case 'mount':
          if (setupCalled) {
            return
          } else {
            // Call global dismount event
            let event = new CustomEvent(type)
            document.dispatchEvent(event)
            setupCalled = true;
          }
          break
        case 'dismount':
          // Call global dismount event
          let event = new CustomEvent(type)
          document.dispatchEvent(event)
          setupCalled = false;
          break
      }

      // Loop over all components that were loaded and try to call any setup JS they have
      this.$el.querySelectorAll('.component').forEach(component => {
        let componentName = component.getAttribute('class').match(/component--(.*)/)[1] || ''
        if (componentName) {
          let event = new CustomEvent(`${componentName}${type}`)
          document.dispatchEvent(event)
        }
      })
    }
  }
}
