'use strict';

const chai = require('chai'),
  proxyquire = require('proxyquire').noCallThru(),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai');

chai.use(sinonChai);

const getUpdatePageMetadata = ({ put }) => {
    return proxyquire('./update-page-metadata', { axios: { put } });
  },
  {
    CLAY_ACCESS_KEY: accessKey,
    CLAY_SITE_PROTOCOL: protocol
  } = process.env,
  { expect } = chai,
  headers = { headers: { Authorization: `token ${accessKey}` } };

describe('update-page-metadata', () => {
  it('should PUT to the meta components', () => {
    const put = sinon.spy(),
      mockArticleData = getMockArticleData(),
      fn = getUpdatePageMetadata({ put });

    fn(mockArticleData);

    expect(put).to.have.callCount(4);

    expect(put.getCall(0).args).to.deep.equal([
      `${protocol}://description-ref`,
      { description: 'some description' },
      headers
    ]);

    expect(put.getCall(1).args).to.deep.equal([
      `${protocol}://image-ref`,
      { image: 'some image' },
      headers
    ]);

    expect(put.getCall(2).args).to.deep.equal([
      `${protocol}://tags-ref`,
      { tags: 'some tags' },
      headers
    ]);

    expect(put.getCall(3).args).to.deep.equal([
      `${protocol}://title-ref`,
      { title: 'some title' },
      headers
    ]);
  });
});

function getMockArticleData() {
  return {
    metaDescription: { _ref: 'description-ref', description: 'some description' },
    metaImage: { _ref: 'image-ref', image: 'some image' },
    metaTags: { _ref: 'tags-ref', tags: 'some tags' },
    metaTitle: { _ref: 'title-ref', title: 'some title' }
  };
}
