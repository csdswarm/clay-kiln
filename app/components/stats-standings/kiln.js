'use strict';

const _upperFirst = require('lodash/upperFirst'),
  { leagueList, sportsList } = require('../../services/universal/stats');

module.exports = schema => {
  schema.sport._has.options = sportsList.map(sport => ({
    name: _upperFirst(sport),
    value: sport
  }));

  schema.league._has.options = leagueList.map(league => ({
    name: league.toUpperCase(),
    value: league
  }));

  return schema;
};
