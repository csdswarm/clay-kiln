'use strict';
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  expect = require('chai').expect,
  lib = require('./one-required');

describe(dirname, function () {
  describe(filename, function () {
    describe('validate', function () {
      var fn = lib[this.title];

      it('doesn\'t do anything if components aren\'t there', function () {
        var state = {
          components: {
            'www.url.com/_components/some-other-component/instances/a': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if at least one field has value', function () {
        var state = {
          components: {
            'www.url.com/_components/ooyala-player/instances/a': {
              videoId: 'foo'
            }
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if at least one field is valid', function () {
        var state = {
          components: {
            'www.url.com/_components/ooyala-player/instances/a': {
              videoSource: 'Video ID'
            }
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('returns error if no fields have values', function () {
        var state = {
          components: {
            'www.url.com/_components/annotation/instances/a': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/annotation/instances/a',
          location: 'Annotation » Text or Image Url'
        }]);
      });
    });
  });
});
