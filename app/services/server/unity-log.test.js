'use strict';

const { assert, expect } = require('chai'),
  callWrapperImmediately = (data, msg) => (func) => func(data, msg),
  proxyquire = require('proxyquire');

describe('unity-log', () => {
  context('msg is instanceOf Error', () => {
    it('msg unchanged, data to contain error info (stack/kind)', () => {
      const data = {},
        msg = new Error('msg Error');

      proxyquire('./unity-log', {
        'clay-log/plugins/_utils': {
          wrap: callWrapperImmediately(data, msg)
        }
      });

      assert.instanceOf(msg, Error, 'msg is no longer instance of Error');
      expect(data).to.have.property('error');
      expect(data.error).to.have.property('stack');
      expect(data.error).to.have.property('kind');
      expect(data.error.kind).to.equal('Error');
    });
  });

  context('data contains error key', () => {
    describe('error', () => {
      it('has a stack trace and kind set to Error, msg is string', () => {
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

      it('has a stack trace and kind set to CustomError, msg is string', () => {
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

      it('is plain object without and instance of Error', () => {
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
