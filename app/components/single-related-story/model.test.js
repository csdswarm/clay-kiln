'use strict';
/* eslint max-nested-callbacks:[2,5] */

var queryService = require('../../services/server/query'),
  sinon = require('sinon'),
  expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename);

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(queryService, 'searchByQuery');
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('save', function () {
      var fn = lib[this.title];

      it('clears data if url is not provided', function () {
        var ref = 'some ref',
          data = {test: 'test'};

        return expect( fn(ref, data) ).to.deep.equal({});
      });

      it('throws if url but not absolute', function () {
        var ref = 'some ref',
          data = {
            url: '/some-relative-thing'
          };

        return new Promise(function () {
          return fn(ref, data);
        }).catch(function (result) {
          expect(result).to.be.a('Error');
        });
      });

      it('gets article data', function () {
        const ref = 'some ref',
          url = 'http://grubstreet.com/2017/05/test.html',
          headline = 'One Way to Make Captive Whales <em>Happier</em>',
          data = { url: url };

        queryService.searchByQuery.returns(Promise.resolve([{
          canonicalUrl: url,
          pageUri: 'www.grubstreet.com/_pages/cj5tl4cxv00g0cuye0eao3xt5@published',
          authors: 'Jerry Saltz',
          primaryHeadline: headline
        }]));

        return fn(ref, data)
          .then(function (results) {
            expect(results).to.deep.equal({
              url: url,
              title: headline,
              plaintextTitle: 'One Way to Make Captive Whales Happier',
              pageUri: 'www.grubstreet.com/_pages/cj5tl4cxv00g0cuye0eao3xt5@published',
              urlIsValid: true
            });
          });
      });

      it('gets article data and overrides title', function () {
        const ref = 'some ref',
          url = 'http://grubstreet.com/2017/05/test.html',
          headline = 'One Way to Make Captive Whales Happier',
          data = { url: url,
            overrideTitle: 'OverrideTitle'
          };

        queryService.searchByQuery.returns(Promise.resolve([{
          title: headline
        }]));

        return fn(ref, data)
          .then(function (results) {
            expect(results.title).to.deep.equal('OverrideTitle');
          });
      });

      it('returns existing data if query returns no result', function () {
        const ref = 'some ref',
          data = {url: 'http://test.com'};

        queryService.searchByQuery.returns(Promise.resolve([]));

        return fn(ref, data)
          .then(function (results) {
            expect(results).to.deep.equal(data);
          });
      });
    });
  });
});
