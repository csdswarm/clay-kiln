'use strict';

const _ = require('lodash'),
  getNationalSubscriptions = require('./get-national-subscriptions'),
  stationUtils = require('./station-utils'),
  { includesAny } = require('../universal/utils'),

  matchesOn = buildMatchesOn(),
  stationPropsForSyndication = ['callsign', 'name', 'site_slug'];

/**
 * returns the stations which have national subscriptions matching the content
 *
 * @param {object} data
 * @param {object} locals
 * @returns {object[]}
 */
const getStationsSubscribedToContent = async (data, locals) => {
  // we're only covering national content for now
  if (data.stationSlug) {
    return [];
  }

  // unable to declare 'let' and 'const' in parallel
  // eslint-disable-next-line prefer-const
  let [nationalSubscriptions, allStations] = await Promise.all([
    getNationalSubscriptions({ shouldOrder: false }),
    stationUtils.getAllStations({ locals })
  ]);

  nationalSubscriptions = _.chain(nationalSubscriptions)
    .groupBy('station_slug')
    .mapValues(toArrayOfFilters)
    .value();

  const isSubscribed = makeIsSubscribed(data),
    subscribedStations = _.chain(nationalSubscriptions)
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
 * Case insensitive array.includes
 *
 * @param {string[]} arr
 * @param {string} str
 * @returns {bool}
 */
function insensitiveIncludes(arr, str = '') {
  return arr.some(el => el.toLowerCase() === str.toLowerCase());
}

/**
 * returns whether the content is excluded per the filter
 *
 * @param {object} data - the content data
 * @param {string[]} tags - the content's tags
 * @param {object} filter - the subscription filter
 * @returns {bool}
 */
function isExcluded(data, tags, filter) {
  return insensitiveIncludes(filter.excludeSectionFronts, data.sectionFront)
  || insensitiveIncludes(filter.excludeSecondarySectionFronts, data.secondarySectionFront)
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
      ? filter.sectionFront.toLowerCase() === (data.sectionFront || '').toLowerCase()
      : true,
    matchesSecondary = filter.secondarySectionFront
      ? filter.secondarySectionFront.toLowerCase() === (data.secondarySectionFront || '').toLowerCase()
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
    allContent: () => true,
    sectionFront: (data, tags, filter) => matchesSectionFront(data, filter),
    tag: (data, tags, filter) => includesAny(tags, filter.tags),

    sectionFrontAndTag: (data, tags, filter) =>
      matchesSectionFront(data, filter)
      && includesAny(tags, filter.tags),

    sectionFrontOrTag: (data, tags, filter) =>
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

  return subscriptionFiltersPerStation => {

    return subscriptionFiltersPerStation.some(filter => {
      return !isExcluded(data, tags, filter)
        && filter.contentType.includes(data.contentType)
        && matchesOn[filter.populateFrom](data, tags, filter);
    });
  };
}

/**
 * turns an array of subscriptions to an array of the subscription filters
 *
 * this is a helper method since inline'ing it didn't read well imo
 *
 * @param {object[]} subscriptions
 * @returns {object[]}
 */
function toArrayOfFilters(subscriptions) {
  return _.map(subscriptions, 'filter');
}

module.exports = getStationsSubscribedToContent;
