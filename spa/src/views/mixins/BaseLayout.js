/**
 *
 * Base Layout component functionality to be applied to all Layouts.
 *
 */

import $ from 'jquery'
import URL from 'url-parse'
import VueTranspiler from '@/lib/VueTranspiler'
const vueTranspiler = new VueTranspiler()

export default {
  mounted () {
    // Attach vue router listener on SPA links.
    $('a.spa-link').on('click', this.onSpaLinkClick)
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
    onSpaLinkClick: function (event) {
      event.preventDefault()

      // "this" context refers to the vue instance,
      // so we have to pull the dom element off of event (instead of using $(this))
      // if onSpaLinkClick is used as a jquery handler.
      const $element = $(event.currentTarget)

      const linkParts = new URL($element.attr('href'))
      this.$router.push(linkParts.pathname)
    }
  }
}
