'use strict';

// Unity App encompasses permissions which don't belong to a station such as
//   whether you can update a global alert or the homepage
const unityAppDomainName = 'Unity App';

/**
 * given a station, returns its urps domain name
 *
 * ----
 *
 * the following is some background on site_slug vs slug
 *
 * our app considers a station's "slug" to be the property "site_slug" on the
 *   radio api.  This matters because the stations we expose to the frontend
 *   via stationsIHaveAccessTo rename site_slug to slug to make the frontend
 *   read better.  In the backend though it's best to keep site_slug because
 *   we're reading properties directly from the radio api, and overwriting
 *   'slug' with the value in 'site_slug' would cause confusion.
 *
 * the point being, when this method is called it might be from a station from
 *   the back or frontends, hence the fallback to .slug
 *
 * @param {object} station
 * @returns {string}
 */
function getStationDomainName(station) {
  // site_slug might be an empty string from the default station, in which case
  //   we want to use it
  const slug = typeof station.site_slug === 'string'
    ? station.site_slug
    : station.slug;

  return `${station.name} | ${slug}`;
}

module.exports = { getStationDomainName, unityAppDomainName };
