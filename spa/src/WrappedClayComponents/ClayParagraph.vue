<template>
  <div v-html="wrappedClayTemplate"></div>
</template>

<script>

import clayHBS from 'clayhandlebars'
const hbs = clayHBS()

export default {
  name: 'clayparagraph',
  data: function () {
    return {

    }
  },
  computed: {
    wrappedClayTemplate: function () {
      if (window.kiln && window.kiln.componentTemplates && window.kiln.componentTemplates.paragraph) {

        const template = hbs.template(window.kiln.componentTemplates.paragraph)

        console.log(template, 'template')

        const html = template({
          _ref: 'localhost.demo.com/_components/paragraph/instances/new',
          text: 'Test data.'
        })

        console.log(html, 'computed html')

        return html

      } else {
        return '<p>Clay handlebars template not available on window.</p>'
      }
    }
  },
  components: {
    // HelloWorld
  }
}

</script>
