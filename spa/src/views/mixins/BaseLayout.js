/**
 *
 * Base Layout component functionality to be applied to all Layouts.
 *
 */

import URL from 'url-parse'
import VueTranspiler from '@/lib/VueTranspiler'
import * as mutationTypes from '../../vuex/mutationTypes'
import SpaPlayerInterface from '../../lib/SpaPlayerInterface'
const vueTranspiler = new VueTranspiler()
export default {
  mounted () {
    this.onLayoutUpdate()
  },
  updated () {
    this.onLayoutUpdate()
  },
  beforeUpdate () {
    this.onLayoutDestroy()
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
    onSpaLinkClick: function (event, element) {
      event.preventDefault()

      // Remove the event listener
      element.removeEventListener('click', element.fn, false)

      const linkParts = new URL(element.getAttribute('href'))
      this.$router.push(`${linkParts.pathname}${linkParts.query}` || '/')
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
      this.$el.querySelectorAll('a.spa-link').forEach(link => {
        link.addEventListener('click', event => {
          this.onSpaLinkClick(event, link)
        })
      })

      /**
       * Execute web player "routing" logic (determines whether to lazy-load player and auto-initialize player bar).
       *
       * NOTE: playerInterface.router() is async and returns a promise, but onLayoutUpdate() must be synchronous (because Vue lifecycle methods
       * must be synchronous). Since the player exists outside of the slice of DOM managed by the SPA, playerInterface.router() is safe to call
       * as if it was "synchronous" and there is no need to block further execution of onLayoutUpdate() until playerInterface.router() resolves.
       */
      const playerInterface = new SpaPlayerInterface(this)
      playerInterface.router()

      // Attach player play listener on play buttons/elements.
      this.$el.querySelectorAll('[data-play-station]').forEach(element => {
        element.addEventListener('click', (event) => {
          event.preventDefault()
          event.stopPropagation()
          const playbackStatus = element.classList.contains('show__play') ? 'play' : 'pause'

          playerInterface[playbackStatus](element.dataset.playStation)
        })
      })

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
