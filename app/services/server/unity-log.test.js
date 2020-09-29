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
    expect(data.error.kind).to.equal('Error');
  });
});
