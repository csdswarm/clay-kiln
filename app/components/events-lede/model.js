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
  dateParse = require('date-fns/parse');

module.exports = unityComponent({
  render: (uri, data, locals) => {
    data._computed = {
      date: data.startDate && data.startTime ? dateFormat(dateParse(data.startDate + ' ' + data.startTime)) : null,
      addressLink: `https://www.google.com/maps/dir//${ data.venueAddress }`
    };

    return data;
  },
  save: (uri, data, locals) => {
    if (!data.url || !locals) {
      return data;
    }

    const query = queryService.newQueryWithCount(elasticIndex, 1, locals),
      canonicalUrl = utils.urlToCanonicalUrl(
        urlToElasticSearch(data.url)
      );

    queryService.addFilter(query, { term: { canonicalUrl } });
    queryService.addFilter(query, { terms: { contentType: 'event' } });
    if (locals.station) {
      queryService.addMust(query, { match: { station: locals.station } });
    }
    queryService.onlyWithTheseFields(query, elasticFields);
    return queryService.searchByQuery(query)
      .then(function (result) {
        return {
          ...data,
          url: data.url.replace(/^http:/, protocol),
          headline: result.headline || 'Stars & Strings 2019 - A RADIO.COM Event', //mock
          startDate: result.startDate || '2019-12-04', //mock
          startTime: result.startTime || '19:00', //mock
          venueName: result.venueName || 'Barclays Center', //mock
          venueAddress: result.venueAddress || '620 Atlantic Ave, Brooklyn, NY 11217', //mock
          feedImgUrl: result.feedImgUrl || 'https://images.radio.com/wnshfm/S%26S2019_DL_NYC_775x515.jpg', //mock
          description: data.description || `Tickets ON SALE NOW! Get 'em before they're gone. Lorem ipsum dolor sit amet, consectetur adipiscing.` //mock
        };
      })
      .catch(e => {
        queryService.logCatch(e, uri);
        return data;
      });
  }
});
