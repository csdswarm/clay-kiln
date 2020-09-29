'use strict';

const rendererPipeline = require('./renderer-pipeline');

module.exports = (ref, data, locals) => {
  return rendererPipeline(ref, data, locals, 'gnf');
};

