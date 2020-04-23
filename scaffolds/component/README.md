# component

## Summary

Scaffolds the necessary files for a Unity clay component

## Usage

```bash
plop component
```

OR

```bash
plop component a-component "Does something amazing" true "adds a `blah` _computed property" "saves input as ..."
```

## Parameters

- **name:** \[input] The name of the new component. Should be kebabCase.
- **description:** \[input] A brief summary of the component
- **includeUnitTests:** \[confirm] Answer Y to include unit tests in the scaffold
- **renderTestDescription:** \[input?] What the description should be in the first test for the `render` function (e.g. in the `it` description)
    - only available when `includeUnitTests` is true
- **saveTestDescription:** \[input?] What the description should be in the first test for the `save` function (e.g. in the `it` description)
    - only available when `includeUnitTests` is true

## Detail

Use the `component` scaffold to create a new Unity clay component with all necessary files (and perhaps a few that are not). 

This handles all the boilerplate code needed, such as the bootstrap, schema, model and even styleguide files

If you just use the simple format, you will be prompted for all the parameters needed:

```bash
plop component
? Component name: a-brand-new-component
? Please provide a brief description: This does something fabulous
? Will this include unit tests? (Y/n) Y
? Please provide a description for the first render test (it should): render something awesome 
? Please provide a description for the first save test (it should): tranform the blah property before saving
```

If you answer "n" to "Will this include unit tests?", then you will not be prompted for descriptions of the first test
and no model.test.js file will be created.

## Result

Once all the prompts have been answered successfully, The following files will be added to the `app/components` folder
in a folder named after the new component name given

- `bootstrap.yml`
- `model.js`
- `model.test.js` (only if you are including unit tests)
- `schema.yml`
- `template.hbs`

Additionally, a file will be added to the `app/styleguides/demo/components` folder with the name of the component entered

Each of these files will have various portions already filled out and completed as needed with boilerplate options for
a new Unity clay component.

After they are all created, they will automatically be staged (not committed) to git for the current branch.
