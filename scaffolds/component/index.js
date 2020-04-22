'use strict'

const LAST_DOT_EXP = /\.(?=[^\.]+$)/;

module.exports = plop => {
  plop.setGenerator('component', {
    description: 'Scaffolds the files needed for a Unity clay component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name:'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Please provide a brief description:'
      },
      {
        type: 'confirm',
        name: 'includeUnitTests',
        message: 'Will this include unit tests?'
      },
      {
        type: 'input',
        name: 'renderTestDescription',
        message: 'Please provide a description for the first render test (it should):',
        when: ({ includeUnitTests }) => includeUnitTests
      },
      {
        type: 'input',
        name: 'saveTestDescription',
        message: 'Please provide a description for the first save test (it should):',
        when: ({ includeUnitTests }) => includeUnitTests
      }
    ],
    actions: ({ includeUnitTests }) => {
      const
        tests = includeUnitTests ? ['model.test.js'] : [],
        actions = ['bootstrap.yml', 'model.js', ...tests, 'schema.yml', 'template.hbs']
          .map(fileName => ({
            type: 'add',
            path: `app/components/{{kebabCase name}}/${fileName}`,
            templateFile: `component/${fileName.split(LAST_DOT_EXP)[0]}.hbs`
          }))
      actions.push({
        type: 'add',
        path: 'app/styleguides/demo/components/{{kebabCase name}}.css',
        templateFile: 'component/styleguide.hbs'
      })
      actions.push({
        type: 'gitStage',
        paths: actions.map(({ path }) => path)
      })

      return actions
    }
  })
}
