'use strict';

const qs = require('qs'),
  rest = require('../universal/rest'),
  log = require('../../services/universal/log').setup({ file: __filename });

module.exports.getAlerts = async (params) => {
  try {
    return await rest.get(`/alerts?${qs.stringify(params)}`);
  } catch (err) {
    log('error', 'issue getting alerts', err);
    return [];
  }
};
