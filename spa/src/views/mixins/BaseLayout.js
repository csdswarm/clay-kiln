/**
 *
 * Base Layout component functionality to be applied to all Layouts.
 *
 */

import URL from 'url-parse'
import VueTranspiler from '@/lib/VueTranspiler'
const vueTranspiler = new VueTranspiler()

export default {
  mounted () {
    // Attach vue router listener on SPA links.
    document.querySelectorAll('a.spa-link').forEach(link => {
      link.addEventListener('click', event => {
        this.onSpaLinkClick(event, link)
      })
    })
  },
  methods: {
    componentList: function (stateSliceKey) {

      // Return early if data not set.
      if (!this.$store.state.spaPayload[stateSliceKey]) {
        return ''
      }

      // The handlebars wrapper template will basically just load the component-list partial and pass in the appropriate property/key on this.spaPayload.
      const handlebarsWrapper = this.$store.state.handlebars.compile(`{{> component-list ${stateSliceKey} }}`);

      // Pass entire payload to wrapper template, template will pull correct data off it via stateSliceKey.
      const handlebarsHtml = handlebarsWrapper(this.$store.state.spaPayload);

      // Transpile handlebars HTML to Vue templating HTML
      return vueTranspiler.transpile(handlebarsHtml)
    },
    onSpaLinkClick: function (event, element) {
      event.preventDefault()

      // Remove the event listener
      element.removeEventListener('click', element.fn, false)

      const linkParts = new URL(element.getAttribute('href'))
      this.$router.push(linkParts.pathname)
    }
  }
}
