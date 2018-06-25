'use strict';
const expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename),
  rest = require('../../services/universal/rest'),
  sinon = require('sinon');

describe(dirname, function () {
  describe(filename, function () {
    describe('save', function () {
      const fn = lib[this.title],
        uri = 'domain.com/_components/foo';
      let sandbox = sinon.sandbox.create();

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(rest, 'get');
      });
      afterEach(function () {
        sandbox.restore();
      });

      it('clearing "url" removes other properties', function () {
        const mockData = {
            embedValid: true,
            url: '',
            html: 'somehtml',
            padding: '10%'
          },
          expectedResult = {
            embedValid: true,
            url: '',
            html: '',
            padding: '',
            lastGenerated: ''
          };

        expect(fn(uri, mockData)).to.deep.equal(expectedResult);
      });

      it('adds embedly html', function (done) {

        const mockData = {
            url: 'http://foo.com'
          },
          mockApiResponse = {
            html: '<div>somehtml</div>'
          },
          expectedResult = {
            embedValid: true,
            url: mockData.url,
            html: mockApiResponse.html,
            padding: '',
            lastGenerated: mockData.url
          };

        rest.get.resolves(mockApiResponse);
        return fn(uri, mockData)
          .then((result) => {
            expect(result).to.deep.equal(expectedResult);
            done();
          });
      });

      it('computes padding', function (done) {
        const mockData = {
            url: 'http://foo.com'
          },
          mockApiResponse = {
            html: '<div>somehtml</div>',
            height: 100,
            width: 50
          },
          expectedResult = {
            url: mockData.url,
            html: mockApiResponse.html,
            padding: '200.0%',
            lastGenerated: mockData.url,
            embedValid: true
          };

        rest.get.resolves(mockApiResponse);
        return fn(uri, mockData)
          .then((result) => {
            expect(result).to.deep.equal(expectedResult);
            done();
          });
      });

      it('errors if Embedly request fails', function (done) {
        const mockData = {
            url: 'http://foo.com'
          },
          expectedResult = {
            url: 'http://foo.com',
            embedValid: false
          };

        rest.get.rejects();
        fn(uri, mockData)
          .then(data => {
            expect(data).to.deep.equal(expectedResult);
            done();
          });
      });

      it('removes html tags from "url"', function (done) {
        const mockData = {
            url: '<p>http://foo.com</p>'
          },
          mockApiResponse = {
            html: '<div>somehtml</div>'
          },
          expectedResult = {
            url: 'http://foo.com',
            html: mockApiResponse.html,
            padding: '',
            lastGenerated: 'http://foo.com',
            embedValid: true
          };

        rest.get.resolves(mockApiResponse);
        return fn(uri, mockData)
          .then((result) => {
            expect(result).to.deep.equal(expectedResult);
            done();
          });

      });

      it('does not query Embedly if sanitized url matches lastGenerated', function () {
        const mockData = {
            url: '<p>http://foo.com</p>',
            lastGenerated: 'http://foo.com',
            html: 'foo'
          },
          result = fn(uri, mockData);

        expect(result.html).to.equal('foo');
        expect(rest.get.called).to.be.false;
      });

    });
  });
});
