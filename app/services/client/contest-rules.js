'use strict';

const rest = require('../universal/rest'),
  qs = require('qs'),
  getContestRules = (params) => {
    const paramsAsString = qs.stringify(params);

    return rest.get(`/rdc/api/contest-rules?${paramsAsString}`);
  };

module.exports.getContestRules = getContestRules;
