'use strict';

const format = require('date-fns/format'),
  mockArticle = require('../mock/article'),
  parse = require('date-fns/parse');

const pubDate = format(parse(mockArticle.date), 'ddd, DD MMM YYYY HH:mm:ss ZZ');

module.exports = [
  { title: { _cdata: 'test headline' } },
  { link: 'https://clay.radio.com/articles/abc-music-news/leslie-odom-jr-reveals-that-he-almost-walked-out-of-the-hamilton-movie-over' },
  { pubDate },
  {
    guid: [
      {
        _attr: {
          isPermaLink: false
        }
      },
      '664887'
    ]
  },
  { syndicatedUrl: 'https://www.radio.com/news/delta-to-resume-flights-between-united-states-and-china' },
  { description: { _cdata: 'test seoDescription' } },
  { 'content:encoded': { _cdata: '' } },
  { stationUrl: 'http://www.610sports.com/' },
  { stationTitle: undefined },
  { subHeadline: 'test subHeadline' },
  { seoHeadline: { _cdata: 'test seoHeadline' } },
  { coverImage: 'https://stg-images.radio.com/aiu-media/e-leslieodomjr-081120.jpg' },
  { featured: false },
  { featured_sports: false },
  { featured_news: false },
  { lead: { _cdata: '' } },
  { category: 'test tag 1' },
  { category: 'test tag 2' },
  { 'dc:creator': { slug: 'bob-diehl', text: 'Bob Diehl' } },
  { editorialFeeds: 'Trending' }
];
