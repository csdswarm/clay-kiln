/**
 * const contestOverdue = currentTime - contestEndtTime
 *
 * return contestOverdue < 30days
 */

'use strict';
/* eslint-disable one-var */

const { unityComponent } = require('../../services/universal/amphora');
const rest = require('../../services/universal/rest.js');
const db = require('amphora-storage-postgres');
const {
  PRIVACY_POLICY
} = require('../../services/universal/constants');
const moment = require('moment');
const maxAgeInDays = 31;
const url = require('url');
const _get = require('lodash/get');
const log = require('../../services/universal/log').setup({ file: __filename });

/**
 * Creates a conditional station operator for contest sql query
 * @param {String} stationCallsign
 * @returns {String}
 */
const stationQuery = stationCallsign => `AND data->>'stationCallsign' = '${stationCallsign}'`;

/**
 * Queries the db for contest rules
 * @param {String} param.startTime
 * @param {String} param.stationCallsign
 */
const getContestRules = async ({
  startTime = '',
  stationCallsign = ''
}) => {
  const contestRulesQuery = /* sql */ `
    SELECT *
    FROM components."contest"

    -- make sure contest is active within current time
    WHERE data->>'endDateTime' >= '${startTime}'

    -- show contests that are active within 30 days from current time
    AND DATE_PART(
      'day',
      (data ->> 'endDateTime')::timestamp - '${startTime}'::timestamp
    ) <= ${maxAgeInDays}

    AND id SIMILAR TO '%@published'
    ${stationQuery(stationCallsign)}
  `;

  const { rows } = await db.raw(contestRulesQuery);
  const pluckData = ({ data }) => data;

  return rows.map(pluckData);
};

module.exports = unityComponent({
  render: async (ref, data, locals = {}) => {
    // NOTE: locals is undefined during migration/bootstrap
    const isBootstrapping = locals === undefined;

    if (isBootstrapping) {
      return data;
    }

    const { station, defaultStation, site } = locals;
    const { callsign: defaultCallsign } = defaultStation;
    const { protocol } = site;
    const callsign = _get(locals, 'stationForPermissions.callsign', defaultCallsign);

    const { pathname } = url.parse(locals.url);
    const isPresentationMode = pathname === '/contests';
    const startTime = moment().toISOString(true);

    try {
      const stationSlugContext = station.site_slug ? `${station.site_slug}/` : '';
      const stationPath = `${process.env.CLAY_SITE_PROTOCOL}://${process.env.CLAY_SITE_HOST}/${stationSlugContext}`;
      const contestRules = await Promise.all((await getContestRules({
        startTime,
        stationCallsign: callsign
      })).map(async (ruleData) => ({
        ...ruleData,
        stationTimeZone: locals.station.timezone,
        showHeader: true,
        showPresentation: isPresentationMode,
        description: (await rest.get(`${protocol}://${ruleData.description[0]._ref}`)).text,
        contestSlug: `${stationPath}contests/${ruleData.slug}`
      })));

      data._computed = {
        showPrivacyPolicy: !isPresentationMode,
        generalContestRulesPath: `${stationPath}general-contest-rules`,
        contestRules,
        privacyPolicyPath: PRIVACY_POLICY
      };

    } catch (error) {
      log('error', '[contest rules failure]', error);
    }

    return data;
  }
});
