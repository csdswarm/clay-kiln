#!/usr/bin/env node
'use strict';

const fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  chalk = require('chalk'),
  speakingurl = require('speakingurl');

/**
 * convert clay-component-names into Component Names!
 * @param {string} name
 * @returns {string}
 */
function label(name) {
  return name.replace(/^clay\-/i, '').split('-').map(_.startCase).join(' ');
}

/**
 * format description for each field
 * @param {string} helpText
 * @returns {string}
 */
function formatDescription(helpText) {
  return helpText || '_No description given._';
}

/**
 * remove site logic from component names
 * @param {string} item
 * @returns {string}
 */
function removeSiteLogic(item) {
  var match = item.match(/([\w-]+)(?:\s?\((.*?)\))?/);

  return match ? match[1] : item;
}

/**
 * create a markdown link from a component name
 * @param {string} item
 * @returns {string}
 */
function createMarkdownLink(item) {
  return `[\`${label(item)}\`](https://github.com/nymag/sites/blob/master/components/${item}/README.md)`;
}

/**
 * create a markdown link for an input
 * @param {string} item
 * @returns {string}
 */
function createInputLink(item) {
  return `[${label(item)}](https://github.com/nymag/clay-kiln/blob/master/inputs/README.md#${item})`;
}

function createInlineLink(item, fields, groupName) {
  var fieldLabel;

  if (!fields[item]) {
    console.log(chalk.red(`Group "${groupName}" references a field that cannot exist in a form: "${item}"`));
    process.exit(1);
  }

  fieldLabel = fields[item].name;

  return `[${fieldLabel}](#${speakingurl(fieldLabel)})`;
}

/**
 * get description for a component list
 * @param {object} list
 * @returns {string}
 */
function getListDescription(list) {
  if (list.include && list.include.length === 1) {
    return 'A component list that includes: ' + _(list.include).map(removeSiteLogic).map(createMarkdownLink).value().join(', ') + '.';
  } else if (list.include) {
    return 'A component list that includes multiple components.'; // these will be listed below, not inline
  } else {
    return 'A component list that includes all components.';
  }
}

/**
 * get components in a component list if there are more than one
 * @param {object} list
 * @returns {array}
 */
function getComponentList(list) {
  if (list.include && list.include.length > 1) {
    return _.map(list.include, removeSiteLogic);
  } else {
    return [];
  }
}

/**
 * get readme data from the schema
 * @param {string} component
 * @returns {Function}
 */
function getReadmeData(component) {
  return function (schema) {
    let description = schema._description || '_No description given._',
      fields = _.reduce(schema, function (result, val, key) {
        if (!val) {
          console.log(chalk.red(`Cannot generate readme for ${component} » ${key}!`));
        } else if (val._has) {
          let name = val._label || key,
            input = val._has,
            type = val._has.input,
            placeholder = val._placeholder,
            attachedButton = _.get(val, '_has.attachedButton.name');

          result[key] = {
            name: name,
            desc: formatDescription(input.help),
            type: type,
            placeholder: placeholder,
            attachedButton: attachedButton
          };
        } else if (val._componentList) {
          // also add component lists, specifying what components they include
          let name = val._label || key,
            desc = `${getListDescription(val._componentList)}`,
            placeholder = val._placeholder,
            list = getComponentList(val._componentList);

          result[key] = {
            name: name,
            desc: desc, // note: component lists don't have a _display property
            placeholder: placeholder,
            list: list
          };
        }

        return result;
      }, {}),
      groups = _.reduce(schema._groups, function (result, val, key) {
        if (!val) {
          console.log(chalk.red(`Cannot generate readme for ${component} » ${key}!`));
        } else {
          let name = val._label || key,
            fields = val.fields.map(function (fieldName) { return fieldName.match(/^(\w+)(?:\s?\((.*)\))?$/)[1]; }),
            placeholder = val._placeholder;

          result[key] = {
            name: name,
            fields: fields,
            placeholder: placeholder
          };
        }

        return result;
      }, {});

    return {
      name: component,
      description: description,
      groups: groups,
      fields: fields
    };
  };
}

/**
 * get placeholder values
 * @param {object} placeholder
 * @returns {string}
 */
function getPlaceholder(placeholder) {
  if (placeholder.permanent) {
    return 'Permanent';
  } else if (placeholder.ifEmpty && _.split(placeholder.ifEmpty, ' ').length === 1) {
    return `If ${placeholder.ifEmpty} is empty`;
  } else if (placeholder.ifEmpty) {
    return `If ${placeholder.ifEmpty} are empty`;
  } else {
    return 'Yes';
  }
}

/**
 * format groups for the readme
 * @param {object} groups
 * @param {object} fields to grab labels
 * @returns {string}
 */
function formatGroups(groups, fields) {
  let formatted = '';

  if (!_.isEmpty(groups)) {
    formatted += '## Groups\n';
  }

  _.each(groups, function (group) {
    formatted += `### ${group.name}\n\n`;

    if (group.placeholder) {
      formatted += `**Placeholder:** ${getPlaceholder(group.placeholder)}<br />`;
    }

    formatted += '\n';
    formatted += group.fields.map(function (field) {
      return `* ${createInlineLink(field, fields, group.name)}`;
    }).join('\n');
    formatted += '\n\n';
  });

  return formatted;
}

/**
 * format fields for the readme
 * @param {object} fields
 * @returns {string}
 */
function formatFields(fields) {
  let formatted = '';

  _.each(fields, function (field) {
    formatted += `### ${field.name}\n\n${field.desc}\n\n`;

    if (field.type) {
      formatted += `**Input:** ${createInputLink(field.type)}<br />`; // single line break
    }

    if (field.placeholder) {
      formatted += `**Placeholder:** ${getPlaceholder(field.placeholder)}<br />`; // single line break
    }

    // add attached button
    if (field.attachedButton) {
      formatted += `**Attached Button:** ${field.attachedButton}\n\n`;
    }

    // add components for a list (if there's more than one)
    if (!_.isEmpty(field.list)) {
      formatted += '**Components:**\n\n';
      formatted += field.list.map(function (component) {
        return `* ${createMarkdownLink(component)}`;
      }).join('\n');
      formatted += '\n\n';
    }

    if (_.isEmpty(field.attachedButton) && _.isEmpty(field.list)) {
      formatted += '\n\n';
    }
  });

  if (_.isEmpty(fields)) {
    formatted = '_No fields specified in the schema._';
  }

  return formatted;
}

/**
 * create readme from data
 * @param {object} data
 * @returns {string} of markdown
 */
function createReadme(data) {
  let readme = `# ${data.name}
A component for [Clay](https://github.com/nymag/amphora/wiki#clay-is-divided-into-components).

## Description
${data.description}
${formatGroups(data.groups, data.fields)}
## Fields
${formatFields(data.fields)}
---
_Autogenerated by Clay. Edit the \`schema.yml\` to change this readme. Schema conforms to the Kiln 5.0 spec._
`;

  return readme;
}

/**
 * save readme for component
 * @param {string} component
 * @returns {Function}
 */
function saveReadme(component) {
  return function (readme) {
    return fs.writeFileSync(path.join('components', component, 'README.md'), readme);
  };
}

/**
 * generate readme for a single component
 * @param {string} component
 * @param {object} schema
 * @returns {Promise}
 */
function generateReadme(component, schema) {
  return Promise.resolve(getReadmeData(component)(schema))
    .then(createReadme)
    .then(saveReadme(component))
    .catch(function (e) {
      console.log(chalk.yellow(`[Warning] Failed to generate README for ${component}`));
      console.log(e);
    });
}

module.exports = generateReadme;
