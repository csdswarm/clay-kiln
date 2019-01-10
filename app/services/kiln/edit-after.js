'use strict';

// mount plugins
require('kiln-plugins')();

// mount models
window.kiln.componentModels = Object.keys(window.modules)
  .filter(function (key) {
    return key.slice(-6) === '.model';
  })
  .reduce(function (acc, key) {
    acc[key.replace('.model','')] = window.require(key);
    return acc;
  }, {});
