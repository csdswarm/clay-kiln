'use strict';

const format = require('date-fns/format'),
  mockGallery = require('../mock/gallery'),
  parse = require('date-fns/parse');

const pubDate = format(parse(mockGallery.date), 'ddd, DD MMM YYYY HH:mm:ss ZZ');

module.exports = [
  { title: { _cdata: 'test headline' } },
  { link: 'https://clay.radio.com/music/gallery/test-seo-headline' },
  { pubDate },
  {
    guid: [
      {
        _attr: {
          isPermaLink: false
        }
      },
      'ckdqf7jdz000ke3o4vtvyry1f'
    ]
  },
  { syndicatedUrl: undefined },
  {
    description: {
      _cdata: 'test seo description test seo description test seo description test seo description test seo description test seo description test seo description test seo description '
    }
  },
  { 'content:encoded': { _cdata: '' } },
  { stationUrl: undefined },
  { stationTitle: undefined },
  { subHeadline: 'test subheadline' },
  { seoHeadline: { _cdata: 'test seo headline' } },
  { coverImage: 'https://stg-images.radio.com/aiu-media/cat1-e0e6c162-3f21-4acd-b4dc-1248794eefef.jpg' },
  { featured: true },
  { featured_sports: true },
  { featured_news: true },
  { slides: { _cdata: '' } },
  { lead: { _cdata: '' } },
  { category: 'test tag 1' },
  { category: 'test tag 2' },
  { 'dc:creator': { slug: 'bob-diehl', text: 'Bob Diehl' } }
];
