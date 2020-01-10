'use strict';

const fs = require('fs'),
  _forIn = require('lodash/forIn'),
  handlebars = require('handlebars'),
  nymagHbs = require('clayhandlebars'),
  hbs = nymagHbs(handlebars.create()),
  glob = require('glob'),
  path = require('path'),
  helpers = require('../universal/helpers'),
  log = require('../universal/log').setup({ file: __filename }),
  cmptNameRe = /components\/([^\/]+)\//;

let cmptToRenderFn = {};

/**
 * init hbs partials for feed components
 */
function init() {
  _forIn(helpers, function (value, key) {
    // set up handlebars helpers that rely on internal services
    hbs.registerHelper(`${key}`, value);
  });

  // searches the components directories for any feed.hbs files -- was having weird behavior when using relative path.. was starting in /app
  const templates = glob.sync(path.join(__dirname, '..', '..', 'components', '**', '*feed.hbs'));

  // compile the feed.hbs files
  templates.forEach(template => {
    const match = template.match(cmptNameRe),
      format = template.match(/[^\/]+(?=\.feed\.hbs)/);

    if (match) {
      const partialName = format ? `${match[1]}.${format[0]}` : match[1];

      hbs.partials[partialName] = hbs.compile(`${fs.readFileSync(template)}`, { preventIndent: true });
    }
  });

  const cmptsWithModel = glob.sync(path.join(__dirname, '../../components/*/model.js'));

  cmptToRenderFn = cmptsWithModel.reduce(
    (result, pathToCmpt) => {
      const cmptName = pathToCmpt.match(cmptNameRe)[1],
        model = require(`../../components/${cmptName}/model`);

      if (model.render) {
        result[cmptName] = model.render;
      }

      return result;
    },
    {}
  );
};

function getPartialName(cmptName, format) {
  const partialNameWithFormat = format ? `${cmptName}.${format}` : cmptName,
    partialExists = !!hbs.partials[partialNameWithFormat];

  return partialExists
    ? partialNameWithFormat
    : cmptName;
}

/**
 * render a feed component from the name and data
 *
 * this is async because it calls model.render which is necessary for some feed
 *   formats.  I'm choosing to keep this async method separate in order to
 *   prevent bad merges.
 *
 * @param {String} cmptName
 * @param {String} cmptData
 * @param {string} [format]
 * @param {string} uri
 * @param {object} locals
 * @returns {String}
 */
// I'm trying not to refactor too much right now due to the amount of time this
//   ticket has taken.  If we still want to cater to this max params rule then
//   I'm punting a fix for later.
// eslint-disable-next-line max-params
async function renderComponentAsync(cmptName, cmptData, format, uri, locals) {
  const partialName = getPartialName(cmptName, format);

  if (!hbs.partials[partialName]) {
    log('error', `No handlebars partial exists for ${partialName}`);
    return '';
  }

  const render = cmptToRenderFn[cmptName];

  if (render) {
    cmptData = await render(uri, cmptData, locals);
  }

  return hbs.partials[partialName](cmptData).trim();
}

/**
 * render a feed component from the name and data
 *
 * @param {String} cmptName
 * @param {Object} cmptData
 * @param {string} [format]
 * @returns {String}
 */
function renderComponent(cmptName, cmptData, format) {
  const partialName = getPartialName(cmptName, format);

  if (!hbs.partials[partialName]) {
    log('warn', `No handlebars partial exists for ${partialName}`);
    return '';
  }

  return hbs.partials[partialName](cmptData);
}

module.exports.init = init;
module.exports.hbs = hbs;
module.exports.renderComponent = renderComponent;
module.exports.renderComponentAsync = renderComponentAsync;
