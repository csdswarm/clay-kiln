'use strict';

// noPreserveCache
// https://www.npmjs.com/package/proxyquire#forcing-proxyquire-to-reload-modules
//
// we use this to cause the re-processing of the environment variable
//   in get-from-urps
const proxyquire = require('proxyquire').noPreserveCache(),
  { expect } = require('chai'),
  sinon = require('sinon');

describe('getFromUrps', () => {
  const axiosPost = sinon.spy(() => Promise.resolve({ data: {} })),
    getExpectedData = () => ({
      decodedCognitoId: 'test123',
      path: `${process.env.URPS_AUTHORIZATIONS_URL}/test/path`
    }),
    mock = {
      // has a decoded property 'sub' with the value 'test123'.  This is the cognito_id
      jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0MTIzIn0.ZOXBQI81oKp29IAZ934o6atL_4c2YyfcLhU3JVGTD3s',
      path: '/test/path',
      reqBody: {}
    },
    makeGetFromUrps = () => proxyquire('./get-from-urps', {
      axios: { post: axiosPost }
    });

  let URPS_AUTHORIZATIONS_URL_orig;

  before(()=> {
    URPS_AUTHORIZATIONS_URL_orig = process.env.URPS_AUTHORIZATIONS_URL;
  });

  beforeEach(() => {
    process.env.URPS_AUTHORIZATIONS_URL = 'host.docker.internal';
    axiosPost.resetHistory();
  });

  after(() => {
    process.env.URPS_AUTHORIZATIONS_URL = URPS_AUTHORIZATIONS_URL_orig;
  });

  it('getFromUrps is called with the correct arguments - with auth layer', async () => {
    process.env.URPS_AUTHORIZATIONS_URL = 'some non-local url';

    const getFromUrps = makeGetFromUrps(),
      expected = getExpectedData();

    await getFromUrps(mock.path, mock.reqBody, mock.jwt);

    expect(axiosPost.calledOnce).to.be.true;
    expect(axiosPost.firstCall.args).to.deep.equal([
      expected.path,
      mock.reqBody,
      { headers: { Authorization: mock.jwt } }
    ]);
  });

  it('getFromUrps is called with the correct arguments - no auth layer', async () => {
    const getFromUrps = makeGetFromUrps(),
      expected = getExpectedData();

    await getFromUrps(mock.path, mock.reqBody, mock.jwt);

    expect(axiosPost.calledOnce).to.be.true;
    expect(axiosPost.firstCall.args).to.deep.equal([
      expected.path,
      { cognito_id: expected.decodedCognitoId },
      {}
    ]);
  });
});
