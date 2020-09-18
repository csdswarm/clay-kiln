'use strict';

module.exports['1.0'] = (uri, data) => {
  data.feeds = {
    rss: true,
    'apple-news': false,
    msn: false,
    smartNews: false
  };

  return data;
};

module.exports['2.0'] = (uri, data) => {
  data.byline = [{
    sources: [],
    hosts: [],
    names: [],
    prefix: 'by'
  }];

  return data;
};
