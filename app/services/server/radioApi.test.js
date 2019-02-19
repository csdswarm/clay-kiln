'use strict';

const expect = require('chai').expect,
  rest = require('../universal/rest'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename),
  sinon = require('sinon'),
  { db } = require('amphora');

describe(dirname, () => {
  let sandbox;
  // post = sinon.stub();

  describe(filename, () => {
    beforeEach(() => {
      sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('get', () => {

      it('will hit the api endpoint and return with a success when not cached', async () => {
        const endpoint = 'endpoint',
          params = {
            this: 'that',
            encoded: 'a test'
          },
          success = { data: { success: true } },
          key = 'api.radio.com/v1/endpoint?this=that&encoded=a%20test',
          url = 'https://api.radio.com/v1/endpoint?this=that&encoded=a test';

        sandbox.stub(db, 'get').returns(Promise.reject(null));
        sandbox.stub(db, 'put').returns(Promise.resolve(null));
        sandbox.stub(rest, 'get').returns(Promise.resolve(success));

        // eslint-disable-next-line one-var
        const result = await lib.get(endpoint, params);

        expect(db.get.callCount).to.eql(1);
        expect(db.get.args[0][0]).to.eql(key);

        expect(result).to.eql(success);
        expect(rest.get.callCount).to.eql(1);
        expect(rest.get.args[0][0]).to.eql(url);

      });

      it('will hit the passed in endpoint and return with a success when not cached', async () => {
        const endpoint = 'http://my.magic/endpoint',
          params = {
            this: 'that',
            encoded: 'a test'
          },
          success = { data: { success: true } },
          key = 'my.magic/endpoint?this=that&encoded=a%20test',
          url = 'http://my.magic/endpoint?this=that&encoded=a test';

        sandbox.stub(db, 'get').returns(Promise.reject(null));
        sandbox.stub(db, 'put').returns(Promise.resolve(null));
        sandbox.stub(rest, 'get').returns(Promise.resolve(success));

        // eslint-disable-next-line one-var
        const result = await lib.get(endpoint, params);

        expect(db.get.callCount).to.eql(1);
        expect(db.get.args[0][0]).to.eql(key);

        expect(result).to.eql(success);
        expect(rest.get.callCount).to.eql(1);
        expect(rest.get.args[0][0]).to.eql(url);
      });

      it.skip('will not hit the api endpoint and return with a success when cached', async () => {
        const endpoint = 'endpoint',
          params = {
            this: 'that',
            encoded: 'a test'
          },
          success = { data: { success: true }, updated_at: new Date() },
          key = 'api.radio.com/v1/endpoint?this=that&encoded=a%20test',
          url = 'https://api.radio.com/v1/endpoint?this=that&encoded=a test';

        sandbox.stub(db, 'get').returns(Promise.resolve(success));
        sandbox.stub(rest, 'get').returns(Promise.resolve(success));

        // eslint-disable-next-line one-var
        const result = await lib.get(endpoint, params);

        expect(db.get.callCount).to.eql(1);
        expect(db.get.args[0][0]).to.eql(key);

        expect(result).to.eql(success);
        expect(rest.get.callCount).to.eql(0);
      });

    });

  });
});
