'use strict';

var expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename);

describe('feeds', () => {
  describe(dirname, () => {
    describe(filename, () => {
      describe('getBrandLabel', () => {
        let fn = lib.getBrandLabel;

        it('returns the label `The Cut` when the slug `wwwthecut` is provided', () => {
          return expect(fn('wwwthecut')).to.eql('The Cut');
        });

        it('returns the label `New York Magazine` when an unrecognized slug `notasite` is provided', () => {
          return expect(fn('notasite')).to.eql('New York Magazine');
        });

        it('returns the label `New York Magazine` when an empty slug is provided', () => {
          return expect(fn('')).to.eql('New York Magazine');
        });
      });

      describe('addMediaContent', () => {
        let fn = lib.addMediaContent,
          data = {
            contentVideo:
              {
                ref: 'domain.com/_components/youtube/instances/foo@published',
                data: '{\"videoId\":\"foo123\",\"videoSource\":\"Video ID\",\"videoType\":\"Editorial\",\"videoLocation\":\"OVT\",\"playerCaption\":\"\",\"autoPlay\":true,\"autoPlayNextVideo\":true,\"previousTypeRelated\":false,\"playerBorderTop\":false,\"playerBorderBottom\":false,\"videoPlaylist\":\"somefooplaylist\",\"videoValid\":true,\"uniquePlayerID\":\"youtube-player-foo456\",\"playerHeadline\":null,\"channelName\":\"New York Magazine\",\"videoTitle\":\"A Foo Title\",\"videoThumbnail\":\"https://i.ytimg.com/vi/foo123/maxresdefault.jpg\",\"videoDuration\":789}'
              },
            feedImgUrl: 'http://domain.com/some/image.jpg'
          },
          transform = [];

        fn(data, transform);

        it('returns formatted data to be transformed into a `media:content` element', () => {
          return expect(transform[0]).to.have.property('media:content');
        });

        it('formatted `media:content` data contains `media:player` data', () => {
          return expect(transform[0]['media:content'][1]).to.have.property('media:player');
        });

        it('formatted `media:content` data contains `media:title` data', () => {
          return expect(transform[0]['media:content'][2]).to.have.property('media:title');
        });

        it('formatted `media:content` data contains `media:description` data', () => {
          return expect(transform[0]['media:content'][3]).to.have.property('media:description');
        });

        it('formatted `media:content` data contains `media:thumbnail` data', () => {
          return expect(transform[0]['media:content'][4]).to.have.property('media:thumbnail');
        });

        it('formatted `media:content` data contains `media:copyright` data', () => {
          return expect(transform[0]['media:content'][5]).to.have.property('media:copyright');
        });
      });
    });
  });
});
