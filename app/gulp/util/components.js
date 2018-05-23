'use strict';
var _ = require('lodash'),
  path = require('path'),
  { getComponents, getComponentPath } = require('amphora-fs'),
  cwd = process.cwd(),
  components = getComponents();

/**
 * get an map of css file globs, per component
 * @return {{}}
 */
function getBaseStylesMap() {
  return _.reduce(components, function (result, name) {
    var filePath = getComponentPath(name).substring(cwd.length + 1),
      npmStyles;

    if (_.includes(filePath, 'node_modules/')) {
      // style is from an npm module, look at the package.json
      npmStyles = require(path.join(cwd, filePath, 'package.json')).style; // get the npm styles. could be a string or array

      if (_.isArray(npmStyles)) {
        result[name + '.css'] = npmStyles.map(function (style) {
          // add the filepath to each style
          return path.join(filePath, style);
        });
      } else if (_.isString(npmStyles)) {
        result[name + '.css'] = path.join(filePath, npmStyles);
      } // else don't add the styles at all
    } else {
      result[name + '.css'] = [filePath + '/*.css', filePath + '/*.scss'];
    }

    return result;
  }, {});
}

/**
 * get an map of js file globs, per component
 * @return {{}}
 */
function getScriptsMap() {
  return _.reduce(components, function (result, name) {
    var filePath = getComponentPath(name).substring(cwd.length + 1),
      npmScripts;

    if (_.includes(filePath, 'node_modules/')) {
      // script is from an npm module, look at the package.json
      npmScripts = require(path.join(cwd, filePath, 'package.json')).browser;

      if (_.isString(npmScripts)) {
        result[name + '.js'] = filePath + '/' + npmScripts;
      } // else don't add the scripts
    } else {
      result[name + '.js'] = filePath + '/client.js';
    }

    return result;
  }, {});
}

/**
 * get an map of js file globs, per component
 * @return {{}}
 */
function getModelsMap() {
  return _.reduce(components, function (result, name) {
    var filePath = getComponentPath(name).substring(cwd.length + 1),
      npmScripts;

    if (_.includes(filePath, 'node_modules/')) {
      // script is from an npm module, look at the package.json
      npmScripts = require(path.join(cwd, filePath, 'package.json')).model;

      if (_.isString(npmScripts)) {
        result[name + '.model.js'] = filePath + '/' + npmScripts;
      } // else don't add the scripts
    } else {
      result[name + '.model.js'] = filePath + '/model.js';
    }

    return result;
  }, {});
}

/**
 * Get an map of handlebars/hbs file globs, per component.
 * Spread templates across files such that there are no more than
 * 100 templates per file.
 * @return {object}
 */
function getTemplatesMap() {
  let templateFile = 0,
    i = 0;

  return _.reduce(components, function (result, name) {
    let filePath = getComponentPath(name).substring(cwd.length + 1),
      npmScripts,
      filename;

    if (i++ > 100) {
      i = 0;
      templateFile++;
    }
    filename = `templates-${templateFile}.js`;
    result[filename] = result[filename] || [];

    if (_.includes(filePath, 'node_modules/')) {

      // script is from an npm module, look at the package.json
      npmScripts = require(path.join(cwd, filePath, 'package.json')).template;

      if (_.isString(npmScripts)) {
        result[filename].push(filePath + '/' + npmScripts);
      } // else don't add the scripts
    } else {
      result[filename].push(filePath + '/template.handlebars');
      result[filename].push(filePath + '/template.hbs');
    }
    return result;
  }, {});
}

/**
 * gets a map of media file globs, per component
 * @return {{}}
 */
function getMediaMap() {
  return _.reduce(components, function (result, name) {
    var filePath = getComponentPath(name).substring(cwd.length + 1);

    result[name] = filePath + '/media/**';
    return result;
  }, {});
}

/**
 * gets a list of css/js file globs for all components
 * @param  {string} type style/script
 * @return {[]}
 */
function getList(type) {
  var map;

  if (type === 'scripts') {
    map = getScriptsMap();
  } else if (type === 'styles') {
    map = getBaseStylesMap();
  } else if (type === 'media') {
    map = getMediaMap();
  } else if (type === 'models') {
    map = getModelsMap();
  } else if (type === 'templates') {
    map = getTemplatesMap();
  }

  return _.flatten(_.values(map));
}

exports.getBaseStylesMap = getBaseStylesMap;
exports.getScriptsMap = getScriptsMap;
exports.getModelsMap = getModelsMap;
exports.getTemplatesMap = getTemplatesMap;
exports.getMediaMap = getMediaMap;
exports.getList = getList;
