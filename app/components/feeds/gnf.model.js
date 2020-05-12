'use strict';

const { rendererPipeline } = require('./utils');

module.exports = (ref, data, locals) => {
  return rendererPipeline(ref, data, locals, 'gnf');
};

