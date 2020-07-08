'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  _flat = require('lodash/flatten'),
  moment = require('moment'),
  queryService = require('../../services/server/query'),
  elasticIndex = 'published-content',
  elasticFields = [
    'itemId',
    'headline',
    'startDate',
    'startTime',
    'venueName',
    'venueAddress',
    'feedImgUrl',
    'canonicalUrl'
  ],
  protocol = `${process.env.CLAY_SITE_PROTOCOL}:`,
  utils = require('../../services/universal/utils'),
  { urlToElasticSearch } = utils,
  { assignStationInfo } = require('../../services/universal/create-content'),
  /**
   * Converts a url to be the format that was indexed
   * @param {String} url
   * @returns {String} url
   */
  toElasticCanonicalUrl = (url) => {
    return utils.urlToCanonicalUrl(
      urlToElasticSearch(url)
    );
  },
  /**
   * Converts event url so that their http protocol
   * matches the protocol of the app.
   * @param {Array} results
   * @returns {Array}
   */
  prepareQueryResults = (results) =>
    results.map(event => {
      return {
        ...event,
        url: event.canonicalUrl.replace(/^http:/, protocol)
      };
    })

  ;

/**
 * Gets event data from elastic by querying with event url
 *
 * @param {Object} data
 * @param {Object} locals
 * @returns {Promise<Array
 *  <
 *    {
 *      url: string,
 *      headline: string,
 *      startDate: Date,
 *      startTime: Date,
 *      venueName: string,
 *      venueAddress: string,
 *      feedImgUrl: string,
 *   }
 *  >
 * >}
 */
async function getCuratedEventsFromElastic(data, locals) {
  const {
      curatedEvents,
      stationSlug
    } = data,
    query = queryService.newQueryWithCount(elasticIndex, curatedEvents.length, locals),
    urlsToMatch = curatedEvents
      .filter(({ url }) => url)
      .map(({ url }) => toElasticCanonicalUrl(url));

  queryService.addMust(query, {
    terms: {
      canonicalUrl: urlsToMatch
    }
  });
  queryService.addFilter(query, { term: { contentType: 'event' } });
  if (stationSlug) {
    queryService.addMust(query, { match: { stationSlug } });
  } else {
    queryService.addMustNot(query, { exists: { field: 'stationSlug' } });
  }
  queryService.onlyWithTheseFields(query, elasticFields);

  return queryService.searchByQuery(
    query,
    locals,
    { shouldDedupeContent: false })
    .then(prepareQueryResults)
    .catch(e => {
      queryService.logCatch(e, curatedEvents);
      return [];
    });
}

/**
 * Gets recent events data from elastic
 *
 * @param {string} uri
 * @param {Object} data
 * @param {Object} locals
 * @param {Number} numItems
 * @param {Number} skip
 * @returns {Promise<{
  *  url: string,
  *  headline: string,
  *  startDate: Date,
  *  startTime: Date,
  *  venueName: string,
  *  venueAddress: string,
  *  feedImgUrl: string,
  * }[]>}
  */
async function getRecentEventsFromElastic(uri, data, locals, { numItems, skip }) {
  const query = queryService.newQueryWithCount(elasticIndex, numItems, locals),
    {
      curatedEvents = [],
      eventsLedeUrl = ''
    } = data,
    urlsToDedupe = [
      eventsLedeUrl,
      ...curatedEvents
        .filter(({ url }) => url)
        .map(({ url }) => url)
    ].map(toElasticCanonicalUrl);

  // dedupe curated events
  queryService.addMustNot(query, {
    terms: {
      canonicalUrl: urlsToDedupe
    }
  });

  // items gte today
  queryService.addMust(query, {
    range: {
      startDate: {
        gte: new Date().toISOString()
      }
    }
  });

  queryService.addFilter(query, { term: { contentType: 'event' } });
  if (data.stationSlug) {
    queryService.addMust(query, { match: { stationSlug: data.stationSlug } });
  } else {
    queryService.addMustNot(query, { exists: { field: 'stationSlug' } });
  }

  queryService.onlyWithTheseFields(query, elasticFields);
  queryService.addSort(query, { startDate: 'asc' });
  queryService.addOffset(query, skip);

  return queryService.searchByQuery(
    query,
    locals,
    { shouldDedupeContent: false })
    .then(prepareQueryResults)
    .catch(e => {
      queryService.logCatch(e, uri);
      return [];
    });
}

module.exports = unityComponent({
  save: async (uri, data, locals) => {
    if (!locals || !locals.defaultStation) {
      return data;
    }

    assignStationInfo(uri, data, locals);
    return data;
  },
  render: async (uri, data, locals) => {
    const { numberToDisplay, curatedEvents } = data,
      initialNumItems = numberToDisplay - curatedEvents.length,
      curatedEventsData = getCuratedEventsFromElastic(data, locals),
      recentEventsData = getRecentEventsFromElastic(
        uri, data, locals, {
          numItems: initialNumItems,
          skip: 0
        }
      ),
      events = _flat(await Promise.all([
        curatedEventsData,
        recentEventsData
      ])),
      prepareEvent = event => {
        return {
          ...event,
          dateTime: event.startDate
            ? moment(`${event.startDate} ${event.startTime}`).format('LLLL')
            : 'none'
        };
      };

    data._computed.events = events.map(prepareEvent);

    // load more functionality
    // if there is a page number include more events with the page num as offset
    if (locals.page) {
      const skip = initialNumItems
          + (parseInt(locals.page) - 1) * data.loadMoreAmount + 1,
        moreEvents =  await getRecentEventsFromElastic(
          uri, data, locals, {
            numItems: data.loadMoreAmount,
            skip
          },
        );

      data._computed.moreEvents = moreEvents.map(prepareEvent);
    }

    return data;
  }
});
