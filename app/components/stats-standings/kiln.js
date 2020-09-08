'use strict';
const { applyTeamProps } = require('../../services/client/stats-schema');

module.exports = schema => {
  return applyTeamProps(schema);
};
