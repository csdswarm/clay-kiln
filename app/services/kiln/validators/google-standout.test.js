'use strict';
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  expect = require('chai').expect,
  sinon = require('sinon'),
  dateFormat = require('date-fns/format'),
  subDays = require('date-fns/sub_days'),
  circulationService = require('../../../services/universal/circulation'),
  lib = require('./google-standout');

describe(dirname, function () {
  describe(filename, function () {
    describe('validate', function () {
      var fn = lib[this.title],
        locals = { site: { slug: 'url' } },
        sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(circulationService, 'getRollingStandoutArticles');
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('doesn\'t do anything if there is no tag and no google standout component', function () {
        var state = {
          components: {
            'www.url.com/_components/some-other-component/instances/a': {}
          }, locals
        };

        expect(fn(state)).to.eql(undefined);
      });

      it('doesn\'t do anything if there is no google standout component', function () {
        var state = {
          components: {
            'www.url.com/_components/tags/instances/a': {
              items: [
                {
                  text: 'breaking'
                }
              ]
            }
          }, locals
        };

        expect(fn(state)).to.eql(undefined);
      });

      it('doesn\'t do anything if there is the google standout component is already active', function () {
        var state = {
          components: {
            'www.url.com/_components/tags/instances/a': {
              items: [
                {
                  text: 'breaking'
                }
              ]
            },
            'www.url.com/_components/google-standout/instances/b': {
              active: true
            }
          }, locals
        };

        expect(fn(state)).to.eql(undefined);
      });

      it('doesn\'t do anything if there is there are no target tags', function () {
        var state = {
          components: {
            'www.url.com/_components/tags/instances/a': {
              items: [
                {
                  text: 'some other tag'
                }
              ]
            },
            'www.url.com/_components/google-standout/instances/b': {
              active: false
            }
          }, locals
        };

        expect(fn(state)).to.eql(undefined);
      });

      it('doesn\'t do anything if the article was published more than 2 calender days ago', function () {
        var state = {
          components: {
            'www.url.com/_components/tags/instances/a': {
              items: [
                {
                  text: 'some other tag'
                }
              ]
            },
            'www.url.com/_components/google-standout/instances/b': {
              active: false
            }
          },
          page: {
            state: {
              firstPublishTime: dateFormat(subDays(new Date(), 3))
            }
          }, locals
        };

        expect(fn(state)).to.eql(undefined);
      });

      it('doesn\'t do anything if the client circulation service rejects', function () {
        var state = {
          components: {
            'www.url.com/_components/tags/instances/a': {
              items: [
                {
                  text: 'breaking'
                }
              ]
            },
            'www.url.com/_components/google-standout/instances/b': {
              active: false
            }
          }, locals
        };

        circulationService.getRollingStandoutArticles.returns(Promise.reject(new Error('nope')));
        return fn(state).then(function (res) {
          expect(res).to.eql(undefined);
        });
      });

      it('doesn\'t do anything if the client circulation service returns 7 or more results', function () {
        var state = {
          components: {
            'www.url.com/_components/tags/instances/a': {
              items: [
                {
                  text: 'breaking'
                }
              ]
            },
            'www.url.com/_components/google-standout/instances/b': {
              active: false
            }
          }, locals
        };

        circulationService.getRollingStandoutArticles.returns(Promise.resolve([{}, {}, {}, {}, {}, {}, {}]));
        return fn(state).then(function (res) {
          expect(res).to.eql(undefined);
        });
      });

      it('returns a warning when a standout tag can be applied to the article', function () {
        var state = {
          components: {
            'www.url.com/_components/article/instances/s': {
              some: 'key'
            },
            'www.url.com/_components/tags/instances/a': {
              items: [
                {
                  text: 'breaking'
                }
              ]
            },
            'www.url.com/_components/google-standout/instances/b': {
              active: false
            }
          }, locals
        };

        circulationService.getRollingStandoutArticles.returns(Promise.resolve([{}, {}]));
        return fn(state).then(function (res) {
          expect(res).to.eql([{
            uri: 'www.url.com/_components/article/instances/s',
            field: 'shouldBeGoogleStandout',
            location: 'Article » Mark Google Standout'
          }]);
        });
      });
    });
  });
});
