/**
 * const contestOverdue = currentTime - contestEndtTime
 *
 * return contestOverdue < 30days
 */

'use strict';
/* eslint-disable one-var */

const { unityComponent } = require('../../services/universal/amphora');
const rest = require('../../services/universal/rest.js');
const { getContestRules } = require('../../services/server/contest-rules');
const {
  PRIVACY_POLICY
} = require('../../services/universal/constants');
const { isPresentationMode } = require('../../services/universal/contest-rules-page');
const _get = require('lodash/get');
const log = require('../../services/universal/log').setup({ file: __filename });

module.exports = unityComponent({
  render: async (ref, data, locals) => {
    // NOTE: locals is undefined during migration/bootstrap
    const isBootstrapping = locals === undefined;

    if (isBootstrapping) {
      return data;
    }

    const { station, defaultStation, site } = locals;
    const { callsign: defaultCallsign } = defaultStation;
    const { protocol } = site;
    const callsign = _get(locals, 'stationForPermissions.callsign', defaultCallsign);
    const showPresentation = isPresentationMode(locals.url);

    try {
      const stationSlugContext = station.site_slug ? `${station.site_slug}/` : '';
      const stationPath = `${process.env.CLAY_SITE_PROTOCOL}://${process.env.CLAY_SITE_HOST}/${stationSlugContext}`;
      const contestRules = await Promise.all((await getContestRules({
        stationCallsign: callsign
      })).map(async (ruleData) => ({
        ...ruleData,
        stationTimeZone: locals.station.timezone,
        showHeader: true,
        showPresentation,
        description: (await rest.get(`${protocol}://${ruleData.description[0]._ref}`)).text,
        contestSlug: `${stationPath}contests/${ruleData.slug}`
      })));

      data._computed = {
        showPrivacyPolicy: !showPresentation,
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
