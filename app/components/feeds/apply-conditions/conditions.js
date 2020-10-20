'use strict';

/**
 * This file holds the data necessary to transform the desired filter and
 *   exclude query params into their ES query counterparts.  The keys of this
 *   object thus represent all the filters and excludes available to feed
 *   consumers. e.g. /reversechron.rss?andFilter[station]=WFANAM
 */

const { formatUTC } = require('../../../services/universal/dateTime'),
  { subscribedContentOnly } = require('../../../services/universal/recirc/recirculation');

/**
 * Formats the dates in the array then sorts them in ascending order
 *
 * @param {array} dateArray
 * @return {array}
 */
function formatSortDate(dateArray) {
  return dateArray.map(date => formatUTC(date))
    .sort((date1, date2) => (new Date(date1)).getTime() - (new Date(date2)).getTime());
}

module.exports = {
  // vertical (sectionfront) and/or exclude tags
  vertical: { createObj: sectionFront => ({ match: { sectionFront } }) },
  // tags
  tag: { createObj: tag => ({ match: { 'tags.normalized': tag } }) },
  // subcategory (secondary article type)
  subcategory: {
    createObj: secondarySectionFront => ({ match: { 'secondarySectionFront.normalized': secondarySectionFront } })
  },
  // editorial feed (grouped stations)
  editorial: { createObj: editorial => ({ match: { [`editorialFeeds.${editorial}`]: true } }) },
  // contentType
  type: {
    filterConditionType: 'addMust',
    createObj: contentType => ({ terms: { contentType } })
  },
  // corporate websites (corporateSyndication)
  corporate: {
    createObj: corporateSyndication => ({ match: { [`corporateSyndication.${corporateSyndication}`]: true } })
  },
  // stations (stationSyndication) - station content
  station: {
    createObj: station => ({
      bool: {
        should: [
          { match: { stationCallsign: station } },
          {
            nested: {
              path: 'stationSyndication',
              query: {
                bool: {
                  must: [
                    {
                      bool: {
                        should: [
                          { match: { 'stationSyndication.callsign': station } },
                          { match: { 'stationSyndication.callsign.normalized': station } }
                        ],
                        minimum_should_match: 1
                      }
                    },
                    ...subscribedContentOnly
                  ]
                }
              }
            }
          }
        ],
        minimum_should_match: 1
      }
    })
  },
  // genres syndicated to (genreSyndication)
  genre: { createObj: genreSyndication => ({ match: { 'genreSyndication.normalized': genreSyndication } }) },
  // date
  created_date: {
    filterConditionType: 'addMust',
    createObj: ({ value, operator = 'gte' }) => ({ range: { date: { [operator]: formatUTC(value) } } })
  },
  // date range
  created_date_between: {
    filterConditionType: 'addMust',
    createObj: ({ start = new Date().toISOString(), end = new Date().toISOString() }) => {
      const dates = formatSortDate([start, end]);

      return { range: { date: { gte: dates[0], lte: dates[1] } } };
    }
  },
  // modified date
  modified_date: {
    filterConditionType: 'addMust',
    createObj: ({ value, operator = 'gte' }) => ({ range: { dateModified: { [operator]: formatUTC(value) } } })
  },
  // modified_date range
  modified_date_between: {
    filterConditionType: 'addMust',
    createObj: ({ start = new Date().toISOString(), end = new Date().toISOString() }) => {
      const dates = formatSortDate([start, end]);

      return { range: { dateModified: { gte: dates[0], lte: dates[1] } } };
    }
  },
  // exclude content from importer (only works for exclude, not filter)
  importer: {
    createObj: () => ({
      nested : {
        path : 'stationSyndication',
        query : {
          exists : {
            field : 'stationSyndication.importer'
          }
        }
      }
    })
  }
};
