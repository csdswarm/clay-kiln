# create

## Summary

Creates the scaffold for a new scaffold

## Usage


```bash
plop create
```

OR

```bash
plop create [name] [description]
```

## Parameters

- **name:** \[input] The name of the scaffold. This should be in either camel or kebab case, and its folder will be translated to 
          kebab case.
- **description:** \[input] This is the summary of what the new scaffold does.


## Detail

Use the `create` scaffold to scaffold out a new scaffold. 

For instance, if you want to create a new scaffold for a migration, you can do either of the following:

```bash
plop create migration "Scaffolds a new migration with the folder name set to the date followed by the currrent branch name"
```

If you can't remember the parameters, you can simply write `plop create` and you will be prompted for the params.

```bash
plop create
? What do you want to call this scaffold? migration
? Please provide a brief description of the scaffold: Scaffolds a new migration with the folder name set to the date followed by the currrent branch name
```

## Result

This will create a new component folder with the name you gave converted to kebab-case if it wasn't already. in that 
folder will be a `README.md`, `index.js` and `template.hbs` file.

`README.md` will have the name and summary filled out and will provide a base structure for the rest of the file to be
filled in. There are suggestions on how to fill these areas in. Please make sure to update the README.md file for 
your scaffold before committing.

`index.js` will come pre-populated with examples of every main parameter type supplied by inquirer and most have examples
  of each property available for each type (some, but not all will have comments describing possible variations)

`template.hbs` will be a generic template file with some examples of how the data might be used. It is likely you will 
wish to create more templates with different names for different functions.

The main `scaffold/index.js` file will be updated to reference your new scaffold so you can use it immediately.

All of the files above will automatically get staged to git

As soon as this completes, you can try out your new scaffold by typing

```bash
plop YourScaffoldName
```

Where _YourScaffoldName_ is the exact name you gave your scaffold in the name param. If this is the first time you are 
using this scaffold, try out each of the prompts to see how they work.

_NOTE: this newly created scaffold will not stage changes to git, so you may need to look for any files it creates and
delete them._
