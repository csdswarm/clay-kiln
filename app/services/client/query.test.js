'use strict';

var expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename),
  bluebird = require('bluebird'),
  sinon = require('sinon'),
  amphora = require('amphora'),
  siteService = amphora.sites,
  db = amphora.db;

const INDEX = 'pages',
  TYPE = '_doc';

describe(dirname, function () {
  describe(filename, function () {
    var sandbox,
      locals = {site: {host: 'site.com', port: 3001, path: ''}},
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
        expect(result.body.query).to.eql({});
      });

    });

    describe('newQueryWithCount', function () {
      var fn = lib[this.title];

      it('returns a new object with size property', function () {
        const query = fn(INDEX, 3, locals);

        expect(query.index).to.equal(INDEX);
        expect(query.type).to.equal(TYPE);
        expect(query.body.query).to.eql({});
        expect(query.body.size).to.equal(3);
      });

    });

    describe('searchByQueryWithRawResult', function () {
      var fn = lib[this.title],
        query = lib(INDEX, locals);

      it('hits the search endpoint', function () {
        const respObj = {hits: {hits: ['hello']}};

        lib.post.returns(Promise.resolve(respObj));
        fn(query).then(function (result) {
          expect(respObj).to.eql(result);
        });
      });

    });

    describe('searchByQuery', function () {
      var fn = lib[this.title],
        query = lib(INDEX, locals);

      it('hits the search endpoint', function () {
        const respObj = {hits: {hits: ['hello']}};

        lib.post.returns(Promise.resolve(respObj.hits.hits));
        fn(query).then(function (result) {
          expect(respObj.hits.hits).to.eql(result);
        });
      });

      it('throw error if query fails', function () {
        lib.post.returns(Promise.reject());
        fn(query).catch(function (result) {
          expect(result).to.throw(Error);
        });
      });

    });

    describe('getCount', function () {
      var fn = lib[this.title];

      it('returns number of results found', function () {
        const respObj = {hits: {hits: ['hello']}},
          query = lib(INDEX, locals);

        lib.post.returns(Promise.resolve(respObj));

        fn(query).catch(function (result) {
          expect(result).to.equal(1);
        });
      });

      it('returns 0 if query returns an error', function () {
        const query = lib(INDEX, locals);

        lib.post.returns(Promise.reject(0));

        fn(query).catch(function (result) {
          expect(result).to.equal(0);
        });
      });
    });

    describe('executeMultipleSearchRequests', function () {
      var fn = lib[this.title];
      const respObj = {hits: {hits: ['hello']}},
        query = [lib(INDEX), lib('published-articles')]; // create a query array with multiple queries

      it('hits the search endpoint', function () {
        lib.post.returns(Promise.resolve(respObj));
        fn(query).then(function (result) {
          expect(result).to.eql(respObj);
        });
      });

    });

    describe('onePublishedArticleByUrl', function () {
      var fn = lib[this.title];

      it('returns a query for a single published article', function () {
        const q = fn('http://page-url', [], locals);

        expect(q.index).to.equal('published-articles');
        expect(q.body.query.bool.filter.term).to.have.property('canonicalUrl');
      });

      it('applies provided fields', function () {
        const fields = ['pageUri, featureTypes'],
          q = fn('http://page-url', fields, locals);

        expect(q.body._source.include).to.include('pageUri, featureTypes');
      });
    });

  });
});
