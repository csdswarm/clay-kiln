'use strict';

const rest = require('../universal/rest'),
  log = require('../../services/universal/log').setup({ file: __filename });

module.exports.getAlerts = async (params) => {
  try {
    const { origin } = window.location;

    return await rest.get(`${origin}/alerts`, { params });
  } catch (err) {
    log('error', 'issue getting alerts', err);
    return [];
  }
};
