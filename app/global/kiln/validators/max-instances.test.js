'use strict';
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  expect = require('chai').expect,
  lib = require('./max-instances');

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

      it('doesn\'t do anything if less than or equal to max', function () {
        var state = {
          components: {
            'www.url.com/_components/single-related-story/instances/a': { a: 'b' },
            'www.url.com/_components/annotations/instances/a': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('returns error if more than max', function () {
        var state = {
          components: {
            'www.url.com/_components/single-related-story/instances/a': { a: 'b' },
            'www.url.com/_components/single-related-story/instances/b': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/single-related-story/instances/b',
          location: 'Single Related Story'
        }]);
      });
    });
  });
});
