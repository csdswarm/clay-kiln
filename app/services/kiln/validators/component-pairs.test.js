'use strict';
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  expect = require('chai').expect,
  lib = require('./component-pairs');

describe(dirname, function () {
  describe(filename, function () {
    describe('validate', function () {
      var fn = lib[this.title];

      it('doesn\'t do anything if components aren\'t there', function () {
        var state = {
          components: {
            'www.url.com/_components/some-other-component/instances/a': {}
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if equal number of components', function () {
        var state = {
          components: {
            'www.url.com/_components/interactive-homelessness-tab/instances/a': {},
            'www.url.com/_components/interactive-homelessness-panel/instances/a': {}
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('returns error if more of the first component', function () {
        var state = {
          components: {
            'www.url.com/_components/interactive-homelessness-tab/instances/a': { a: 'b' },
            'www.url.com/_components/interactive-homelessness-tab/instances/b': { a: 'b' },
            'www.url.com/_components/interactive-homelessness-panel/instances/a': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/interactive-homelessness-tab/instances/b',
          location: 'Interactive Homelessness Tab',
          preview: 'The number of tabs does not match the number of tab panels.'
        }]);
      });

      it('returns error if many more of the first component', function () {
        var state = {
          components: {
            'www.url.com/_components/interactive-homelessness-tab/instances/a': { a: 'b' },
            'www.url.com/_components/interactive-homelessness-tab/instances/b': { a: 'b' },
            'www.url.com/_components/interactive-homelessness-tab/instances/c': { a: 'b' },
            'www.url.com/_components/interactive-homelessness-panel/instances/a': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/interactive-homelessness-tab/instances/c',
          location: 'Interactive Homelessness Tab',
          preview: 'The number of tabs does not match the number of tab panels.'
        }]);
      });

      it('returns error if more of the second component', function () {
        var state = {
          components: {
            'www.url.com/_components/interactive-homelessness-tab/instances/a': { a: 'b' },
            'www.url.com/_components/interactive-homelessness-panel/instances/a': { a: 'b' },
            'www.url.com/_components/interactive-homelessness-panel/instances/b': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/interactive-homelessness-panel/instances/b',
          location: 'Interactive Homelessness Panel',
          preview: 'The number of tabs does not match the number of tab panels.'
        }]);
      });

      it('returns error if many more of the second component', function () {
        var state = {
          components: {
            'www.url.com/_components/interactive-homelessness-tab/instances/a': { a: 'b' },
            'www.url.com/_components/interactive-homelessness-panel/instances/a': { a: 'b' },
            'www.url.com/_components/interactive-homelessness-panel/instances/b': { a: 'b' },
            'www.url.com/_components/interactive-homelessness-panel/instances/c': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/interactive-homelessness-panel/instances/c',
          location: 'Interactive Homelessness Panel',
          preview: 'The number of tabs does not match the number of tab panels.'
        }]);
      });
    });
  });
});
