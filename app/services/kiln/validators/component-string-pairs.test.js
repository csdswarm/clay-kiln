'use strict';
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  expect = require('chai').expect,
  lib = require('./component-string-pairs');

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

      it('doesn\'t do anything if strings aren\'t there', function () {
        var state = {
          components: {
            'www.url.com/_components/clay-paragraph/instances/a': {
              text: 'foo'
            },
            'www.url.com/_components/interactive-homelessness-panel/instances/a': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if equal number of strings and components', function () {
        var state = {
          components: {
            'www.url.com/_components/clay-paragraph/instances/a': {
              text: '<span class="clay-annotated kiln-phrase">foo</span>'
            },
            'www.url.com/_components/annotation/instances/a': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('returns error if more strings', function () {
        var state = {
          components: {
            'www.url.com/_components/clay-paragraph/instances/a': {
              text: '<span class="clay-annotated kiln-phrase">foo</span>'
            },
            'www.url.com/_components/clay-paragraph/instances/b': {
              text: '<span class="clay-annotated kiln-phrase">bar</span>'
            },
            'www.url.com/_components/annotation/instances/a': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/clay-paragraph/instances/b',
          field: 'text',
          location: 'Paragraph',
          preview: 'Article annotations do not match annotations components. (2 vs 1)'
        }]);
      });

      it('returns error if more components', function () {
        var state = {
          components: {
            'www.url.com/_components/clay-paragraph/instances/a': {
              text: '<span class="clay-annotated kiln-phrase">foo</span>'
            },
            'www.url.com/_components/annotation/instances/a': { a: 'b' },
            'www.url.com/_components/annotation/instances/b': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/annotation/instances/b',
          location: 'Annotation',
          preview: 'Article annotations do not match annotations components. (1 vs 2)'
        }]);
      });

      it('counts multiple strings in a single component', function () {
        var state = {
          components: {
            'www.url.com/_components/clay-paragraph/instances/a': {
              text: '<span class="clay-annotated kiln-phrase">foo</span><span class="clay-annotated kiln-phrase">bar</span>'
            },
            'www.url.com/_components/annotation/instances/a': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/clay-paragraph/instances/a',
          field: 'text',
          location: 'Paragraph',
          preview: 'Article annotations do not match annotations components. (2 vs 1)'
        }]);
      });
    });
  });
});
