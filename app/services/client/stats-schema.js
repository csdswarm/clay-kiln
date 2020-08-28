'use strict';

const _flow = require('lodash/flow'),
  _upperFirst = require('lodash/upperFirst'),
  { sportsList, leagueList } = require('../universal/stats'),
  allowedFields = ['sport', 'league', 'teamId'];

function createSelect(options, toUpperCase = false) {
  return {
    input: 'select',
    options: options.map(opt => ({
      name: toUpperCase ? opt.toUpperCase() : _upperFirst(opt),
      value: opt
    }))
  };
}

function addFieldRequired() {
  return {
    validate: {
      required: true
    }
  };
}

function getSchemaFields(schema) {
  return Object.keys(schema).filter(field => allowedFields.includes(field));
}

// we separate these since the stats components can be sport wide, league wide, etc.
function addSport(schema) {
  return {
    ...schema,
    sport: {
      _has: {
        ...createSelect(sportsList),
        ...addFieldRequired()
      }
    }
  };
}
function addLeague(schema) {
  return {
    ...schema,
    league: {
      _has: {
        ...createSelect(leagueList, true),
        ...addFieldRequired()
      }
    }
  };
}

function addTeam(schema) {
  return {
    ...schema,
    teamId: {
      _has: {
        input: 'text',
        ...addFieldRequired()
      }
    }
  };
}

function addSettingsGroup(schema) {
  return {
    ...schema,
    _groups: {
      settings: {

        fields: [
          ...getSchemaFields(schema)
        ],
        _placeholder: {
          text: schema.schemaName,
          height: '30px',
          ifEmpty: getSchemaFields(schema).join(' or ')
        }
      }
    }
  };
}

function applySportProps(schema) {
  return _flow(addSport, addSettingsGroup)(schema);
}
function applyLeagueProps(schema) {
  return _flow(addSport, addLeague, addSettingsGroup)(schema);
}
function applyTeamProps(schema) {
  return _flow(addSport, addLeague, addTeam, addSettingsGroup)(schema);
}

module.exports = { applyLeagueProps, applySportProps, applyTeamProps };
