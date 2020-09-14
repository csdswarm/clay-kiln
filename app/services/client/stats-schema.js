'use strict';

const _flow = require('lodash/flow'),
  _upperFirst = require('lodash/upperFirst'),
  _intersection = require('lodash/intersection'),
  _mergeWith = require('lodash/mergeWith'),
  _isArray = require('lodash/isArray'),
  { sportsList, leagueList } = require('../universal/stats'),
  allowedFields = ['sport', 'league', 'teamId'];

function addFieldRequired() {
  return {
    validate: {
      required: true
    }
  };
}

function concatArrays(objValue, srcValue) {
  if (_isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

function createSelect(options, toUpperCase = false) {
  return {
    input: 'select',
    options: options.map(opt => ({
      name: toUpperCase ? opt.toUpperCase() : _upperFirst(opt),
      value: opt
    }))
  };
}


function getSchemaFields(schema) {
  return _intersection(Object.keys(schema), allowedFields);
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
  const schemaFields = getSchemaFields(schema),
    statsSettingsGroup = {
      _groups: {
        settings: {
          fields: schemaFields,
          _placeholder: {
            text: schema.schemaName,
            height: '30px',
            ifEmpty: schemaFields.join(' or ')
          }
        }
      }
    };

  return _mergeWith({}, statsSettingsGroup, schema, concatArrays);
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
