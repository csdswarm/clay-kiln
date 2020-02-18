'use strict';
/* eslint-disable one-var */

const url = require('url');
const _get = require('lodash/get');
const isUndefined = require('lodash/isUndefined');
const moment = require('moment');
const { unityComponent } = require('../../services/universal/amphora');
const { getContestRules } = require('../../services/server/contest-rules');

module.exports = unityComponent({
  render: async (ref, data, locals) => {
    // NOTE: locals is undefined during migration/bootstrap
    const isBootstrapping = isUndefined(locals);

    if (isBootstrapping) {
      return data;
    }

    const callsign = _get(locals, 'stationForPermissions.callsign', '');
    const siteSlug = _get(locals, 'params.stationSlug', '');
    const { pathname } = url.parse(locals.url);
    const isPresentationMode = pathname.includes('/contests');
    const startTime = moment().toISOString(true);
    const contestLinkPrefix = siteSlug ? `/${siteSlug}` : '';
    const contestRules = (await getContestRules({
      startTime,
      stationCallsign: callsign
    })).map((ruleData) => ({
      ...ruleData,
      stationTimeZone: locals.station.timezone,
      showHeader: true,
      showPresentation: isPresentationMode,
      contestLink: `${contestLinkPrefix}/contests/${ruleData.slug}`
    }));

    return Object.assign(data, {
      _computed: {
        contestRules,
        pageTitle: isPresentationMode ?
          'Contests' :
          'Contest Rules'
      }
    });
  }
});
