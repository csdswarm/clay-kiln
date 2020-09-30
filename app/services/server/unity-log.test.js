'use strict';

const { assert, expect } = require('chai'),
  callWrapperImmediately = (data, msg) => (func) => func(data, msg),
  proxyquire = require('proxyquire');

describe('unity-log', () => {
  context('msg is instanceOf Error', () => {
    it('msg unchanged, data to contain error info', () => {
      const data = {},
        msg = new Error('msg Error');

      proxyquire('./unity-log', {
        'clay-log/plugins/_utils': {
          wrap: callWrapperImmediately(data, msg)
        }
      });

      assert.instanceOf(msg, Error, 'msg is an instance of Error');
      expect(data).to.have.property('error');
      expect(data.error).to.have.property('stack');
      expect(data.error).to.have.property('kind');
      expect(data.error.kind).to.equal('Error');
    });
  });

  context('data contains error key', () => {
    it('error is instanceOf Error', () => {
      const data = {
          error: new Error('data Error'),
          params: {
            foo: 'bar'
          }
        },
        msg = 'Data will have error object';

      proxyquire('./unity-log', {
        'clay-log/plugins/_utils': {
          wrap: callWrapperImmediately(data, msg)
        }
      });

      expect(msg).to.equal('Data will have error object');
      expect(data).to.have.property('error');
      expect(data.error).to.have.property('stack');
      expect(data.error).to.have.property('kind');
      expect(data.error).to.deep.include({ kind: 'Error' });
      expect(data).to.deep.include({
        params: {
          foo: 'bar'
        }
      });
    });

    it('error is instanceOf CustomError', () => {
      class CustomError extends Error {
        constructor(message) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const data = {
          error: new CustomError('data Error'),
          params: {
            foo: 'bar'
          }
        },
        msg = 'Data will have error object';

      proxyquire('./unity-log', {
        'clay-log/plugins/_utils': {
          wrap: callWrapperImmediately(data, msg)
        }
      });

      expect(msg).to.equal('Data will have error object');
      expect(data).to.have.property('error');
      expect(data.error).to.have.property('stack');
      expect(data.error).to.deep.include({ kind: 'CustomError' });
      expect(data).to.deep.include({
        params: {
          foo: 'bar'
        }
      });
    });

    it('error is plain object', () => {
      const data = {
          error: {
            foo: 'bar'
          },
          params: {
            foo: 'bar'
          }
        },
        msg = 'Data will have error object';

      proxyquire('./unity-log', {
        'clay-log/plugins/_utils': {
          wrap: callWrapperImmediately(data, msg)
        }
      });

      expect(msg).to.equal('Data will have error object');
      expect(data).to.deep.equal({
        error: {
          foo: 'bar'
        },
        params: {
          foo: 'bar'
        }
      });
    });
  });

  context('data does not contain error key', () => {
    it('error key undefined', () => {
      const data = {
          params: {
            foo: 'bar'
          }
        },
        msg = 'Data will have error object';

      proxyquire('./unity-log', {
        'clay-log/plugins/_utils': {
          wrap: callWrapperImmediately(data, msg)
        }
      });

      expect(msg).to.equal('Data will have error object');
      expect(data).to.not.have.property('error');
      expect(data).to.deep.equal({
        params: {
          foo: 'bar'
        }
      });
    });
  });
});
