/**
 * const contestOverdue = currentTime - contestEndtTime
 *
 * return contestOverdue < 30days
 */

'use strict';
const
  _get = require('lodash/get'),
  log  = require('../../services/universal/log').setup({ file: __filename }),
  moment = require('moment'),
  rest = require('../../services/universal/rest.js'),
  { getContestRules } = require('../../services/server/contest-rules'),
  { isPresentationMode } = require('../../services/universal/contest-rules-page'),
  {
    PRIVACY_POLICY
  } = require('../../services/universal/constants'),
  { unityComponent } = require('../../services/universal/amphora');


module.exports = unityComponent({
  render: async (ref, data, locals) => {
    // NOTE: locals is undefined during migration/bootstrap
    const isBootstrapping = locals === undefined;

    if (isBootstrapping) {
      return data;
    }

    const { station, defaultStation, site } = locals,
      { callsign: defaultCallsign } = defaultStation,
      { protocol } = site,
      callsign = _get(locals, 'stationForPermissions.callsign', defaultCallsign),
      showPresentation = isPresentationMode(locals.url);

    try {
      const stationSlugContext = station.site_slug ? `${station.site_slug}/` : '',
        stationPath = `${process.env.CLAY_SITE_PROTOCOL}://${process.env.CLAY_SITE_HOST}/${stationSlugContext}`,
        contestRules = await Promise.all((await getContestRules({
          stationCallsign: callsign
        })).map(await (async (ruleData) => ({
          ...ruleData,
          stationTimeZone: locals.station.timezone,
          showHeader: true,
          showPresentation,
          description: (await rest.get(`${protocol}://${ruleData.description[0]._ref}`)).text,
          contestSlug: `${stationPath}contests/${ruleData.slug}`
        }))).filter((rulesBlock)=>{
          return moment().isAfter(rulesBlock.endDateTime,'day');
        }));

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
