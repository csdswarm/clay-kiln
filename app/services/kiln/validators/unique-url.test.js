'use strict';
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  expect = require('chai').expect,
  sinon = require('sinon'),
  rest = require('../../../services/universal/rest'),
  lib = require('./unique-url');

describe(dirname, function () {
  describe(filename, function () {
    describe('validate', function () {
      var fn = lib[this.title],
        site = { prefix: 'domain.com' },
        location = { port: '80', protocol: 'http:', hostname: 'domain.com'},
        sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(rest, 'getHTML');
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('doesn\'t do anything if no component with evergreenSlug', function () {
        var state = {
          components: {
            'www.url.com/_components/some-other-component/instances/a': {}
          }, site
        };

        expect(fn(state)).to.eql(undefined);
      });

      it('doesn\'t do anything if no component with slug', function () {
        var state = {
          components: {
            'www.url.com/_components/article/instances/a': {
              evergreenSlug: true
            }
          }, site
        };

        expect(fn(state)).to.eql(undefined);
      });

      it('doesn\'t do anything if no http response', function () {
        var state = {
          components: {
            'www.url.com/_components/article/instances/a': {
              evergreenSlug: true,
              slug: 'foo'
            }
          }, site
        };

        rest.getHTML.returns(Promise.reject(new Error('nope')));
        return fn(state, location).then(function (res) {
          expect(res).to.eql(undefined);
        });
      });

      it('doesn\'t do anything if http response is same page', function () {
        var state = {
          components: {
            'www.url.com/_components/article/instances/a': {
              evergreenSlug: true,
              slug: 'foo'
            }
          }, site
        };

        rest.getHTML.returns(Promise.resolve('<div data-uri="www.url.com/_components/article/instances/a"></div>'));
        return fn(state, location).then(function (res) {
          expect(res).to.eql(undefined);
        });
      });

      it('returns error if http response is different page', function () {
        var state = {
          components: {
            'www.url.com/_components/article/instances/a': {
              evergreenSlug: true,
              slug: 'foo'
            }
          }, site
        };

        rest.getHTML.returns(Promise.resolve('some other page'));
        return fn(state, location).then(function (res) {
          expect(res).to.eql([{
            uri: 'www.url.com/_components/article/instances/a',
            field: 'slug',
            location: 'Article » Publish URL',
            preview: '/article/foo.html'
          }]);
        });
      });
    });
  });
});
