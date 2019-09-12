'use strict';

const axios = require('axios'),
  { URL } = require('url'),
  { wrapInTryCatch } = require('../../startup/middleware-utils'),
  /**
   * determines whether the /_lists/new-pages request should pass through
   *   to clay
   *
   * @param {object} req
   * @param {object} res
   * @returns {boolean}
   */
  shouldPassNewPagesRequestToClay = (req, res) => {
    // if the request is intended to reach clay core then just pass it through
    if (req.query.fromClay === 'true') {
      return true;
    }

    const { station, user } = res.locals;

    // clay lists are public, and the ability to create types of pages will be
    //   enforced server-side so filtering this list based off permissions is
    //   for editor convenience.  This means when no user is logged in (e.g.
    //   curl /_lists/new-pages) we should just return the list directly
    //   from clay.
    if (!user) {
      return true;
    }

    // eslint-disable-next-line one-var
    const canCreateSectionFronts = user.can('create').a('section-fronts').at(station.callsign).value,
      // so far the only permission applying filters to this data is creating
      //   section fronts
      hasFullPermissions = canCreateSectionFronts;

    if (hasFullPermissions) {
      return true;
    }

    return false;
  };

/**
 * Adds an endpoint to the router which intercepts the 'new-pages' list and
 *   modifies the response according to the user's permissions
 *
 * @param {object} router - an express router
 */
module.exports = router => {
  router.get('/_lists/new-pages', wrapInTryCatch(async (req, res, next) => {
    if (shouldPassNewPagesRequestToClay(req, res)) {
      next();
      return;
    }

    // otherwise we need to get the data from clay core and filter the result

    // concatenation to get the full url is from here
    // https://stackoverflow.com/a/10185427
    //
    // we should declare this after the short circuit
    // eslint-disable-next-line one-var
    const urlObj = new URL(req.protocol + '://' + req.get('host') + req.originalUrl),
      { user, station } = res.locals,
      canCreateSectionFronts = user.can('create').a('section-fronts').at(station.callsign).value;

    urlObj.searchParams.append('fromClay', 'true');

    // urlObj needs to be mutated before we can get the result
    // eslint-disable-next-line one-var
    const { data: newPages } = await axios.get(urlObj.toString()),
      filteredPages = newPages.filter(item => {
        if (!canCreateSectionFronts && item.id === 'section-front') {
          return false;
        }

        // filter out by station premissions
        // this code assumes all station-specific categories will have an id
        //   `station_${callsign}`.  Categories without the 'station_' prefix
        //   are assumed to be for the national station.
        const callsign = item.id.startsWith('station_')
          ? item.id.slice('station_'.length)
          : 'NATL-RC';

        if (!user.can('access').the('station').at(callsign).value) {
          return false;
        }

        return true;
      });

    res.send(filteredPages);
  }));
};
