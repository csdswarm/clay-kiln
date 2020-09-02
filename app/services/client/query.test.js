'use strict';

var chai = require('chai'),
  { expect } = chai,
  chaiAsPromised = require('chai-as-promised'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  proxyquire = require('proxyquire'),
  noop = require('lodash/noop'),
  lib = proxyquire('./' + filename, {
    '../universal/log': { setup: () => noop }
  }),
  bluebird = require('bluebird'),
  sinon = require('sinon'),
  amphora = require('amphora'),
  siteService = amphora.sites,
  db = require('amphora-storage-postgres');

chai.use(chaiAsPromised);

const INDEX = 'pages',
  TYPE = '_doc';

describe(dirname, function () {
  describe(filename, function () {
    var sandbox,
      locals = { site: { host: 'site.com', path: '' } },
      post = sinon.stub();

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(db);
      sandbox.stub(siteService);
      db.get.returns(bluebird.resolve(null));
      lib.post = post;
    });

    afterEach(function () {
      lib.post = null;
      sandbox.restore();
    });

    describe('newQueryWithLocals', function () {

      it('returns a new object with the specified type and index', function () {
        var result = lib(INDEX, locals);

        expect(result.index).to.equal(INDEX);
        expect(result.type).to.equal(TYPE);
        expect(result.body.query).to.deep.equal({});
      });

    });

    describe('newQueryWithCount', function () {
      var fn = lib[this.title];

      it('returns a new object with size property', function () {
        const query = fn(INDEX, 3, locals);

        expect(query.index).to.equal(INDEX);
        expect(query.type).to.equal(TYPE);
        expect(query.body.query).to.deep.equal({});
        expect(query.body.size).to.equal(3);
      });

    });

    describe('searchByQueryWithRawResult', function () {
      var fn = lib[this.title],
        query = lib(INDEX, locals);

      it('hits the search endpoint', function () {
        const respObj = { hits: { hits: ['hello'] } };

        lib.post.returns(Promise.resolve(respObj));

        return fn(query).then(function (result) {
          expect(respObj).to.equal(result);
        });
      });

    });

    describe('searchByQuery', function () {
      var fn = lib[this.title],
        query = lib(INDEX, locals);

      it('hits the search endpoint', function () {
        const respObj = { hits: { hits: [{ _source: { some: 'prop' } }] } },
          expectedResult = respObj.hits.hits.map(aHit => aHit._source);

        lib.post.returns(Promise.resolve(respObj));

        return fn(query).then(function (result) {
          expect(expectedResult).to.deep.equal(result);
        });
      });

      it('throw error if query fails', function () {
        lib.post.returns(Promise.reject());

        return expect(fn(query)).to.be.rejected;
      });

    });

    describe('getCount', function () {
      var fn = lib[this.title];

      it('returns number of results found', function () {
        const respObj = { hits: {
            hits: ['hello'],
            total: 1
          } },
          query = lib(INDEX, locals);

        lib.post.returns(Promise.resolve(respObj));

        return fn(query).then(function (result) {
          expect(result).to.equal(1);
        });
      });

      it('returns 0 if query returns an error', function () {
        const query = lib(INDEX, locals);

        lib.post.returns(Promise.reject());

        return fn(query).then(function (result) {
          expect(result).to.equal(0);
        });
      });
    });

    describe('executeMultipleSearchRequests', function () {
      var fn = lib[this.title];
      const respObj = { hits: { hits: ['hello'] } },
        query = [lib(INDEX), lib('published-content')]; // create a query array with multiple queries

      it('hits the search endpoint', function () {
        lib.post.returns(Promise.resolve(respObj));

        return fn(query).then(function (result) {
          expect(result).to.equal(respObj);
        });
      });

    });

    describe('onePublishedArticleByUrl', function () {
      var fn = lib[this.title];

      it('returns a query for a single published article', function () {
        const q = fn('http://page-url', [], locals);

        expect(q.index).to.equal('published-content');
        expect(q.body.query.bool.should[0].bool.filter.term).to.have.property('canonicalUrl');
      });

      it('applies provided fields', function () {
        const fields = ['pageUri, featureTypes'],
          q = fn('http://page-url', fields, locals);

        expect(q.body._source.include).to.include('pageUri, featureTypes');
      });
    });

  });
});
