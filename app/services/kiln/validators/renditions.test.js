'use strict';
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  expect = require('chai').expect,
  lib = require('./renditions');

describe(dirname, function () {
  describe(filename, function () {
    describe('validate', function () {
      var fn = lib[this.title];

      it('doesn\'t do anything if no mediaplay images', function () {
        var state = {
          components: {
            'www.url.com/_components/some-other-component/instances/a': {}
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if no special renditions', function () {
        var state = {
          components: {
            'www.url.com/_components/mediaplay-image/instances/a': {
              rendition: 'horizontal'
            }
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if one-column rendition used in one-column layout', function () {
        var state = {
          components: {
            'www.url.com/_components/mediaplay-image/instances/a': {
              rendition: 'flex-large'
            },
            'www.url.com/_components/one-column-layout/instances/a': {}
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if feature rendition used in page with feature lede', function () {
        var state = {
          components: {
            'www.url.com/_components/mediaplay-image/instances/a': {
              rendition: 'test-feature-only'
            },
            'www.url.com/_components/lede-feature/instances/a': {}
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if rendition allowed in both places used in one-column layout', function () {
        var state = {
          components: {
            'www.url.com/_components/mediaplay-image/instances/a': {
              rendition: 'flex-small'
            },
            'www.url.com/_components/one-column-layout/instances/a': {}
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if rendition allowed in both places used in page with feature lede', function () {
        var state = {
          components: {
            'www.url.com/_components/mediaplay-image/instances/a': {
              rendition: 'flex-small'
            },
            'www.url.com/_components/lede-feature/instances/a': {}
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('returns error if rendition allowed in both is used in page without either', function () {
        var state = {
          components: {
            'www.url.com/_components/mediaplay-image/instances/a': {
              rendition: 'flex-small'
            }
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/mediaplay-image/instances/a',
          field: 'rendition',
          location: 'Mediaplay Image',
          preview: 'Flex Small rendition only allowed in one-column layouts or feature pages'
        }]);
      });

      it('returns error if one-column rendition is used in page with feature lede', function () {
        var state = {
          components: {
            'www.url.com/_components/mediaplay-image/instances/a': {
              rendition: 'flex-large'
            },
            'www.url.com/_components/lede-feature/instances/a': {}
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/mediaplay-image/instances/a',
          field: 'rendition',
          location: 'Mediaplay Image',
          preview: 'Flex Large rendition only allowed in one-column layouts'
        }]);
      });

      it('returns error if feature rendition is used in page without feature lede', function () {
        var state = {
          components: {
            'www.url.com/_components/mediaplay-image/instances/a': {
              rendition: 'test-feature-only'
            }
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/mediaplay-image/instances/a',
          field: 'rendition',
          location: 'Mediaplay Image',
          preview: 'Test Feature Only rendition only allowed in feature pages'
        }]);
      });
    });
  });
});
