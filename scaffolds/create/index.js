'use strict'

module.exports = plop => {
  plop.setGenerator('create', {
    description: 'Create a new scaffold for plop',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What do you want to call this scaffold?'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Please provide a brief description of the scaffold'
      }
    ],
    actions: answers => [
      {
        type: 'add',
        path: 'scaffolds/{{kebabCase name}}/index.js',
        templateFile: 'create/index.hbs'
      },
      {
        type: 'add',
        path: 'scaffolds/{{kebabCase name}}/template.hbs',
        templateFile: 'create/template.hbs'
      },
      {
        type: 'add',
        path: 'scaffolds/{{kebabCase name}}/README.md',
        templateFile: 'create/README.hbs'
      },
      {
        type: 'modify',
        path: 'scaffolds/index.js',
        transform: (fileContent, data) => {
          const
            newScaffold = plop.renderString(`  require('./{{kebabCase name}}')(plop);`, data),
            lines = fileContent.split(/\n/),
            firstLine = lines.findIndex(line => line.includes('// generators:')) + 2,
            lastLine = lines.findIndex(line => line.includes('// end generators:')) - 1,
            replaceLen = lastLine - firstLine,
            replaceWith = [newScaffold, ...lines.slice(firstLine, lastLine)].sort();

          lines.splice(firstLine, replaceLen, ...replaceWith);

          return lines.join('\n');
        }
      },
      {
        type: 'gitStage',
        paths: [
          'scaffolds/{{kebabCase name}}/template.hbs',
          'scaffolds/{{kebabCase name}}/index.js',
          'scaffolds/{{kebabCase name}}/README.md',
          'scaffolds/index.js'
        ]
      }
    ]
  })
}
