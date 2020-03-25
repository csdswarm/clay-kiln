'use strict';

const sanitize = require('../../services/universal/sanitize');

module.exports.save = (ref, data) => sanitize.recursivelyStripSeperators(data);
