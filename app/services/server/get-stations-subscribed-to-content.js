'use strict';

const _ = require('lodash'),
  getContentSubscriptions = require('./get-content-subscriptions'),
  stationUtils = require('./station-utils'),
  { includesAny } = require('../universal/utils'),
  { DEFAULT_STATION } = require('../universal/constants'),

  matchesOn = buildMatchesOn(),
  stationPropsForSyndication = ['callsign', 'name', 'site_slug'];

/**
 * returns the stations which have content subscriptions matching the content
 *
 * @param {object} data
 * @param {object} locals
 * @returns {object[]}
 */
const getStationsSubscribedToContent = async (data, locals) => {
  // unable to declare 'let' and 'const' in parallel
  // eslint-disable-next-line prefer-const
  let [contentSubscriptions, allStations] = await Promise.all([
    getContentSubscriptions({ shouldOrder: false }),
    stationUtils.getAllStations({ locals })
  ]);

  contentSubscriptions = _.groupBy(contentSubscriptions, 'station_slug');

  const isSubscribed = makeIsSubscribed(data),
    subscribedStations = _.chain(contentSubscriptions)
      .pick(Object.keys(allStations.bySlug))
      .pickBy(isSubscribed)
      .keys()
      .map(stationSlug => _.pick(
        allStations.bySlug[stationSlug],
        stationPropsForSyndication
      ))
      .value();

  return subscribedStations;
};

/**
 * returns whether the content is excluded per the filter
 *
 * @param {object} data - the content data
 * @param {string[]} tags - the content's tags
 * @param {object} filter - the subscription filter
 * @returns {bool}
 */
function isExcluded(data, tags, filter) {
  return filter.excludeSectionFronts.includes(data.sectionFront)
    || filter.excludeSecondarySectionFronts.includes(data.secondarySectionFront)
    || includesAny(tags, filter.excludeTags);
}

/**
 * returns whether the section fronts match the filter
 *
 * @param {object} data - the content data
 * @param {object} filter - the subscription filter
 * @returns {bool}
 */
function matchesSectionFront(data, filter) {
  const matchesPrimary = filter.sectionFront
      ? filter.sectionFront === data.sectionFront
      : true,
    matchesSecondary = filter.secondarySectionFront
      ? filter.secondarySectionFront === data.secondarySectionFront
      : true;

  return matchesPrimary && matchesSecondary;
}

/**
 * builds the predicates which will match the content based off the
 *   subscription's "populateFrom"
 *
 * @returns {object}
 */
function buildMatchesOn() {
  return {
    'all-content': () => true,
    'section-front': (data, tags, filter) => matchesSectionFront(data, filter),
    tag: (data, tags, filter) => includesAny(tags, filter.tags),

    'section-front-and-tag': (data, tags, filter) =>
      matchesSectionFront(data, filter)
      && includesAny(tags, filter.tags),

    'section-front-or-tag': (data, tags, filter) =>
      matchesSectionFront(data, filter)
      || includesAny(tags, filter.tags)
  };
}

/**
 * makes a predicate which takes a list of subscription filters and returns
 *   whether the content matches any subscription
 *
 * @param {object} data
 * @returns {function}
 */
function makeIsSubscribed(data) {
  // not all content types have tags yet
  const tags = new Set(data.textTags || []);

  return subscriptionsPerStation => subscriptionsPerStation.some(sub => {
    const { filter, from_station_slug: fromStationSlug } = sub,
      matchesStation = fromStationSlug === DEFAULT_STATION.site_slug
        ? !data.stationSlug
        : data.stationSlug === fromStationSlug;

    return matchesStation
      && !isExcluded(data, tags, filter)
      && filter.contentType.includes(data.contentType)
      && matchesOn[filter.populateFrom](data, tags, filter);
  });
}

module.exports = getStationsSubscribedToContent;
