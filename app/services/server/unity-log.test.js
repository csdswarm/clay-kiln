'use strict';

const { assert, expect } = require('chai'),
  proxyquire = require('proxyquire');

describe('unity-log', () => {
  it('msg is Error', () => {
    const data = {},
      msg = new Error('msg Error');

    proxyquire('./unity-log', {
      'clay-log/plugins/_utils': {
        wrap: (func) => func(data, msg)
      }
    });

    assert.instanceOf(msg, Error, 'msg is an instance of Error');
    expect(data).to.have.property('error');
    expect(data.error).to.have.property('stack');
    expect(data.error).to.have.property('kind');
    expect(data.error.kind).to.equal('Error');
  });

  it('data contains error: Error', () => {
    const data = {
        error: new Error('data Error'),
        params: {
          foo: 'bar'
        }
      },
      msg = 'Data will have error object';

    proxyquire('./unity-log', {
      'clay-log/plugins/_utils': {
        wrap: (func) => func(data, msg)
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

  it('data contains error: CustomError', () => {
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
        wrap: (func) => func(data, msg)
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

  it('data does not contain error', () => {
    const data = {
        params: {
          foo: 'bar'
        }
      },
      msg = 'Data will have error object';

    proxyquire('./unity-log', {
      'clay-log/plugins/_utils': {
        wrap: (func) => func(data, msg)
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
