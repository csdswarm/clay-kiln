'use strict';
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  expect = require('chai').expect,
  lib = require('./at-bottom');

describe(dirname, function () {
  describe(filename, function () {
    describe('validate', function () {
      var fn = lib[this.title];

      it('doesn\'t do anything if component isn\'t there', function () {
        var state = {
          components: {
            'www.url.com/_components/article/instances/foo': {
              content: [
                { _ref:  'www.url.com/_components/clay-paragraph/instances/a' },
                { _ref:  'www.url.com/_components/clay-paragraph/instances/b' },
                { _ref:  'www.url.com/_components/clay-paragraph/instances/c' }
              ]
            }
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if there is no article', function () {
        var state = {
          components: {
            'www.url.com/_components/some-other-component/instances/a': {}
          }
        };

        expect(fn(state)).to.eql(undefined);
      });

      it('doesn\'t do anything if article content contains first component at end and does not contain second component', function () {
        var state = {
          components: {
            'www.url.com/_components/article/instances/foo': {
              content: [
                { _ref:  'www.url.com/_components/clay-paragraph/instances/a' },
                { _ref:  'www.url.com/_components/clay-paragraph/instances/b' },
                { _ref:  'www.url.com/_components/single-related-story/instances/c' }
              ]
            }
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if article content contains second component at end and does not contain first component', function () {
        var state = {
          components: {
            'www.url.com/_components/article/instances/foo': {
              content: [
                { _ref:  'www.url.com/_components/clay-paragraph/instances/a' },
                { _ref:  'www.url.com/_components/clay-paragraph/instances/b' },
                { _ref:  'www.url.com/_components/annotations/instances/c' }
              ]
            }
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if article content contains first and second component in order at end', function () {
        var state = {
          components: {
            'www.url.com/_components/article/instances/foo': {
              content: [
                { _ref:  'www.url.com/_components/clay-paragraph/instances/a' },
                { _ref:  'www.url.com/_components/clay-paragraph/instances/b' },
                { _ref:  'www.url.com/_components/single-related-story/instances/c' },
                { _ref:  'www.url.com/_components/annotations/instances/c' }
              ]
            }
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('returns error if first component exists and isn\'t at bottom', function () {
        var data = {
            content: [
              { _ref:  'www.url.com/_components/clay-paragraph/instances/a' },
              { _ref:  'www.url.com/_components/clay-paragraph/instances/b' },
              { _ref:  'www.url.com/_components/single-related-story/instances/b' },
              { _ref:  'www.url.com/_components/clay-paragraph/instances/c' }
            ]
          },
          state = {
            components: {
              'www.url.com/_components/article/instances/foo': data
            }
          };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/single-related-story/instances/b',
          location: 'Single Related Story',
          preview: 'Must be at the bottom of the article.'
        }]);
      });

      it('returns error if second component exists and isn\'t at bottom', function () {
        var data = {
            content: [
              { _ref:  'www.url.com/_components/clay-paragraph/instances/a' },
              { _ref:  'www.url.com/_components/clay-paragraph/instances/b' },
              { _ref:  'www.url.com/_components/annotations/instances/b' },
              { _ref:  'www.url.com/_components/clay-paragraph/instances/c' }
            ]
          },
          state = {
            components: {
              'www.url.com/_components/article/instances/foo': data
            }
          };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/annotations/instances/b',
          location: 'Annotations',
          preview: 'Must be at the bottom of the article.'
        }]);
      });

      it('returns error if first and second components exist and are out of order', function () {
        var data = {
            content: [
              { _ref:  'www.url.com/_components/clay-paragraph/instances/a' },
              { _ref:  'www.url.com/_components/clay-paragraph/instances/b' },
              { _ref:  'www.url.com/_components/annotations/instances/b' },
              { _ref:  'www.url.com/_components/single-related-story/instances/b' }
            ]
          },
          state = {
            components: {
              'www.url.com/_components/article/instances/foo': data
            }
          };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/annotations/instances/b',
          location: 'Annotations',
          preview: 'Must be at the bottom of the article, and below Single Related Story.'
        }]);
      });
    });
  });
});
