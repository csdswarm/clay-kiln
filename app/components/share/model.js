'use strict';
const _get = require('lodash/get'),
  qs = require('querystring'),
  striptags = require('striptags'),
  buildUTMUrl = (url, params = {}) => {
    return encodeURIComponent(`${url}?${qs.stringify({
      utm_campaign: 'sharebutton',
      utm_medium: 'social',
      ...params
    })}`);
  };

module.exports.render = (ref, data, locals) => {
  const title = encodeURIComponent(striptags(data.shortTitle || data.title)),
    domain = _get(locals, 'site.host'),
    stationSlug = _get(locals, 'station.site_slug', ''),
    emailDomain = stationSlug ? `${domain}/${stationSlug}` : domain,
    stationTwitter = _get(locals, 'station.twitter'),
    stationCallSign = _get(locals, 'station.callsign');

  data.twitterHandle = stationTwitter || data.twitterHandle;

  return {
    ...data,
    emailUrl: `mailto:?subject=${title}&body=${buildUTMUrl(locals.url, { utm_source: emailDomain, utm_medium: 'email', utm_term: stationCallSign })}`,
    facebookUrl: `http://www.facebook.com/sharer/sharer.php?u=${buildUTMUrl(locals.url, { utm_source: 'facebook.com', utm_term: stationCallSign })}`,
    twitterUrl: `https://twitter.com/share?text=${title}&via=${data.twitterHandle}&url=${buildUTMUrl(locals.url, { utm_source: 'twitter.com', utm_term: stationCallSign })}`,
    domain,
    stationCallSign
  };
};
