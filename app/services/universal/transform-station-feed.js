
'use strict';
const _get = require('lodash/get'),
  getS3StationFeedImgUrl = require('../server/get-s3-station-feed-img-url'),
  moment = require('moment'),
  { DEFAULT_RADIOCOM_LOGO } = require('../universal/constants');

module.exports = async (
  locals,
  feed,
  numberOfArticles,
  page = 0) => {
  const nodes = feed.nodes
      ? feed.nodes.filter((item) => item.node)
      : [],
    itemRange = {
      start: page * numberOfArticles,
      end: (page + 1) * numberOfArticles
    },
    paginatedResults = nodes.slice(itemRange.start, itemRange.end);

  return {
    hasMoreItems: nodes.length > itemRange.end,
    items: await Promise.all(paginatedResults.map(async (item) => {
      const feedImgUrl = _get(item, "node['OG Image'].src"),
        s3FeedImgUrl = feedImgUrl
          ? await getS3StationFeedImgUrl(feedImgUrl, locals, {
            shouldAddAmphoraTimings: true,
            amphoraTimingLabelPrefix: 'render station'
          })
          : DEFAULT_RADIOCOM_LOGO,
        date = item.node['Post date'],
        formattedDate = moment(
          date,
          'MM/D/YYYY - HH:mm'
        );

      return {
        feedImgUrl: s3FeedImgUrl,
        externalUrl: item.node.URL,
        primaryHeadline: item.node.field_engagement_title || item.node.title,
        date: formattedDate
      };
    }))
  };
};
