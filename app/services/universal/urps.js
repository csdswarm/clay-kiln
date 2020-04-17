'use strict';

/**
 * NOTE: ./constants needs access to getStationDomainName so if this file ends
 *   up needing a value from ./constants then we'll have to restructure the code
 *   to avoid a circular dependency
 */

// Unity App encompasses permissions which don't belong to a station such as
//   whether you can update a global alert or the homepage
const unityAppDomainName = 'Unity App';

/**
 * given a station, returns its urps domain name
 *
 * what's a urps domain ?
 *   : a domain can be thought loosely as a "location" to which a group of
 *     permissions apply.  In unity we have three types of domains: stations,
 *     markets and our app (the app is explained in unityAppDomainName above).
 *     A market contains one to many stations.  This allows us to do something
 *     like assign the 'Unity Admin' role to a user for the 'San Francisco, CA'
 *     market - which gives that user permissions to all stations under
 *     that market.
 *
 * why the name and the slug for a domain name ?
 *   : the domain names are user-facing so they need to be recognizable.
 *     However we also request permissions from URPS using those names so they
 *     have to be unique.  Station names by themselves aren't guaranteed to be
 *     unique hence why we append ` | ${slug}`
 *
 * what's the difference between slug and site_slug ?
 *  : our app considers a station's "slug" to be the property "site_slug" on the
 *    radio api.  This matters because the stations we expose to the frontend
 *    via stationsIHaveAccessTo rename site_slug to slug to make the frontend
 *    read better.  In the backend though it's best to keep site_slug because
 *    we're reading properties directly from the radio api, and overwriting
 *    'slug' with the value in 'site_slug' would cause confusion.
 *
 *    the point being, when this method is called it might be from a station
 *    from the back or frontends, hence the fallback to .slug
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
