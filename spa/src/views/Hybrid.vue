<template>
  <div class="vue-body">
    <div class="top" data-editable="top">{{ this.componentList(this.spaPayload.top) }}</div>
    <!-- <div class="top" data-editable="top">{{ this.spaPayload._self }}</div> -->
  </div>
</template>

<script>

import handlebarsVanilla from 'handlebars'
import clayHBS from 'clayhandlebars'
const handlebars = clayHBS(handlebarsVanilla) //NOTE: MUST COMMENT OUT FILESYSTEM CODE IN CLAYHANDLEBARS INDEX.JS FILE.

// Register Helper depedencies manually
handlebars.registerHelper('getComponentName', function (ref) {
  var result = /components\/(.+?)[\/\.]/.exec(ref) || /components\/(.*)/.exec(ref);

  return result && result[1];
});

// Register Partials depedencies manually
handlebars.registerPartial('TESTuserMessage','<div>By {{author.firstName}} {{author.lastName}}</div>');

handlebars.registerPartial('component-list', `{{#each this~}}
  {{~> (getComponentName _ref) ~}}
{{~/each}}`);

console.log(handlebars, 'HANDLEBARS INSTANCE')
//console.log(clayHandlebarsInstance, 'CLAY HANDLEBARS INSTANCE')


const hbsPartialWrapperTemplate = handlebars.compile(`<div class="handlebars-partial-include-wrapper>{{ testMsg }}</div><div>{{> TESTuserMessage partialPayload }}</div>`);





export default {
  name: 'hybrid',
  data: function () {
    return {
      spaPayload: {},
    }
  },
  created: function () {

    if (window.spaPayload) {
      this.spaPayload = window.spaPayload
    } else {
      throw new Error('SPA Payload failed to load.')
    }

  },
  computed: {
    wrappedClayTemplate: function () {
      if (window.spaPayload) {

        console.log(hbs, 'HBSSSSS')
        

        

        return '<p>oh snap what up?</p>'

      } else {
        return '<p>SPA Payload not available.</p>'
      }
    }
  },
  methods: {
    componentList: function(state) {

      console.log(state, 'INPUT')
      console.log(this.spaPayload, 'data yo')

      // Register partials from kiln
      for (let key in window.kiln.componentTemplates) {
        //console.log(window.kiln.componentTemplates[key], 'compiledtemplate');
        handlebars.registerPartial(key, handlebars.template(window.kiln.componentTemplates[key]));
        console.log(key, 'kiln partial registered!');
      }

      const handlebarsWrapper = handlebars.compile(`<div class="handlebars-wrapper">{{> component-list top }}</div>`);

      //hbs.partials['component-list'](state)

      const partialPayload = {
        author: {
          firstName: 'Reid',
          lastName: 'Masto'
        }
      };

      console.log(hbsPartialWrapperTemplate({testMsg: 'REID', partialPayload}), 'handlebars compiled on fly');

      console.log(handlebarsWrapper(this.spaPayload), 'please WORK');

      // console.log(window.kiln.componentTemplates, 'blah');

      // var partial = hbs.partials['component-list'];
      // if (typeof partial !== 'function') {
      //   partial = hbs.compile(partial);
      // } else {
      //   console.log('already a func')
      // }
      
    },
    logtest: function() {
      console.log('TEST WAS LOGGED')
    },
    whatup: function() {
      console.log('SUP DAWGGGG')
    }
  },
  components: {
    // HelloWorld
  }
}

</script>
