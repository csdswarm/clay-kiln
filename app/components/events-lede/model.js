'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  queryService = require('../../services/server/query'),
  elasticIndex = 'published-content',
  elasticFields = [
    'headline',
    'startDate',
    'startTime',
    'venueName',
    'venueAddress',
    'feedImgUrl'
  ],
  protocol = `${process.env.CLAY_SITE_PROTOCOL}:`,
  utils = require('../../services/universal/utils'),
  { urlToElasticSearch } = utils,
  dateFormat = require('date-fns/format'),
  dateParse = require('date-fns/parse'),
  dateFormatString = 'dddd[,] MMMM d [at] h:mm aa';

module.exports = unityComponent({
  render: (uri, data, locals) => {
    const query = queryService.newQueryWithCount(elasticIndex, 1, locals),
      canonicalUrl = utils.urlToCanonicalUrl(
        urlToElasticSearch(data.url)
      );

    queryService.addFilter(query, { term: { canonicalUrl } });
    queryService.addFilter(query, { term: { contentType: 'event' } });
    if (locals.station.callsign !== locals.defaultStation.callsign) {
      queryService.addMust(query, { match: { station: locals.station } });
    }
    queryService.onlyWithTheseFields(query, elasticFields);
    return queryService.searchByQuery(query)
      .then(function (result) {
        const newData = {
          ...data,
          url: data.url.replace(/^http:/, protocol),
          ...result
        };

        newData._computed = {
          dateTime: newData.startDate && newData.startTime ? dateFormat(dateParse(newData.startDate + ' ' + newData.startTime), dateFormatString) : null,
          addressLink: `https://www.google.com/maps/dir//${ newData.venueAddress }`
        };
        return newData;
      })
      .catch(e => {
        queryService.logCatch(e, uri);
        return data;
      });
  }
});
